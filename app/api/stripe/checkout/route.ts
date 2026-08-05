import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { EARLY_BIRD_LIMIT, BILLING_PLANS, isBillingPlan, type BillingPlan } from "@/lib/pricing";
import { getReferralCouponId } from "@/lib/referral-coupon";

// Creates a Stripe Checkout session for the chosen Pro plan (monthly/annual
// subscription, or a one-time lifetime payment). The webhook (see
// app/api/stripe/webhook/route.ts) is what actually flips the user's plan
// to PRO once payment succeeds — this route only starts checkout.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body: { plan?: unknown } = await req.json().catch(() => ({}));
  const plan: BillingPlan = isBillingPlan(body.plan) ? body.plan : "monthly";
  const { envVar, mode } = BILLING_PLANS[plan];
  const priceId = process.env[envVar];

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    if (!priceId) {
      throw new Error(`${envVar} is not set`);
    }

    let customerId = user.subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: { userId: user.id, stripeCustomerId: customerId },
        update: { stripeCustomerId: customerId },
      });
    }

    // Discount priority: an earned referral reward beats the early-bird
    // promo — it's something the user actually did, not a signup-time perk.
    // Stripe Checkout only accepts a single coupon per session, so only one
    // of the two ever applies.
    let discounts: { coupon: string }[] | undefined;
    let referralRewardId: string | undefined;

    const pendingReward = await prisma.referralReward.findFirst({
      where: { referrerId: user.id, appliedAt: null },
      orderBy: { createdAt: "asc" },
    });
    if (pendingReward) {
      const couponId = await getReferralCouponId();
      discounts = [{ coupon: couponId }];
      referralRewardId = pendingReward.id;
    } else if (process.env.STRIPE_EARLY_BIRD_COUPON_ID) {
      // First EARLY_BIRD_LIMIT paying subscribers get 20% off, applied
      // automatically — no code needed. Only kicks in if the coupon has
      // actually been created in Stripe (STRIPE_EARLY_BIRD_COUPON_ID set).
      const activeCount = await prisma.subscription.count({ where: { plan: "PRO", status: "active" } });
      if (activeCount < EARLY_BIRD_LIMIT) {
        discounts = [{ coupon: process.env.STRIPE_EARLY_BIRD_COUPON_ID }];
      }
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode,
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      ...(discounts ? { discounts } : {}),
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=cancelled`,
      metadata: { userId: user.id, plan, ...(referralRewardId ? { referralRewardId } : {}) },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("stripe checkout failed", err);
    // Stripe's own error message ("An error occurred with our connection to
    // Stripe") is generic on purpose — the useful bit is buried in
    // type/code/detail (the underlying network cause, e.g. ETIMEDOUT vs
    // ENOTFOUND). Surface all of it here since we can't easily hand the
    // Vercel function logs to a non-technical user, but the Network tab is
    // proven to work for that.
    const stripeErr = err as { message?: string; type?: string; code?: string; detail?: unknown };
    const detail =
      stripeErr?.detail instanceof Error
        ? stripeErr.detail.message
        : typeof stripeErr?.detail === "string"
        ? stripeErr.detail
        : undefined;
    const message =
      [stripeErr?.type, stripeErr?.code, stripeErr?.message, detail].filter(Boolean).join(" | ") || "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

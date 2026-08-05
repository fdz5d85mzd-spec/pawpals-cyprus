import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { REFERRAL_DISCOUNT_PERCENT } from "@/lib/referral";
import { getReferralCouponId } from "@/lib/referral-coupon";

export const dynamic = "force-dynamic";

// Fires once, the first time a referred user completes ANY successful
// checkout (subscription or lifetime). Creates the reward row exactly once
// (unique on referredUserId) and, if the referrer already has an active
// paid subscription, applies the discount to their very next invoice right
// away. If the referrer isn't subscribed yet, the reward stays unapplied
// and the checkout route picks it up the next time *they* check out.
async function grantReferralRewardIfEligible(referredUserId: string) {
  const referredUser = await prisma.user.findUnique({ where: { id: referredUserId } });
  if (!referredUser?.referredById) return;

  const existingReward = await prisma.referralReward.findUnique({ where: { referredUserId } });
  if (existingReward) return;

  const reward = await prisma.referralReward.create({
    data: { referrerId: referredUser.referredById, referredUserId, percentOff: REFERRAL_DISCOUNT_PERCENT },
  });

  const referrerSub = await prisma.subscription.findUnique({ where: { userId: referredUser.referredById } });
  if (referrerSub?.stripeSubscriptionId && referrerSub.status === "active") {
    const couponId = await getReferralCouponId();
    await stripe.subscriptions.update(referrerSub.stripeSubscriptionId, { discounts: [{ coupon: couponId }] });
    await prisma.referralReward.update({ where: { id: reward.id }, data: { stripeCouponId: couponId, appliedAt: new Date() } });
  }
}

// The referrer's own checkout (see app/api/stripe/checkout/route.ts) tags
// the session with the pending reward it attached a coupon for — once that
// checkout actually completes, mark the reward applied so it isn't reused.
async function markReferralRewardApplied(rewardId: string, couponId: string) {
  await prisma.referralReward.update({
    where: { id: rewardId },
    data: { stripeCouponId: couponId, appliedAt: new Date() },
  });
}

async function upsertFromSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata.userId;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const plan = sub.status === "active" || sub.status === "trialing" ? "PRO" : "FREE";

  const where = userId ? { userId } : { stripeCustomerId: customerId };

  // current_period_end moved from the Subscription object onto each
  // SubscriptionItem in newer API versions (part of flexible-billing
  // support for multi-item subscriptions) — we only ever create
  // single-item subscriptions, so the first item's period end is the one.
  const currentPeriodEnd = sub.items.data[0]?.current_period_end;

  await prisma.subscription.upsert({
    where,
    create: {
      userId: userId!,
      plan,
      status: sub.status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : undefined,
    },
    update: {
      plan,
      status: sub.status,
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : undefined,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${err}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      if (checkoutSession.mode === "subscription" && checkoutSession.subscription) {
        const subId =
          typeof checkoutSession.subscription === "string"
            ? checkoutSession.subscription
            : checkoutSession.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        if (checkoutSession.metadata?.userId && !sub.metadata.userId) {
          sub.metadata.userId = checkoutSession.metadata.userId;
        }
        await upsertFromSubscription(sub);
      } else if (checkoutSession.mode === "payment") {
        // One-time lifetime purchase — there's no Stripe Subscription object
        // at all here, so this is the only place that ever flips the user
        // to PRO for this plan. No currentPeriodEnd/stripeSubscriptionId
        // means "never expires" everywhere else that reads Subscription.
        const userId = checkoutSession.metadata?.userId;
        const customerId =
          typeof checkoutSession.customer === "string" ? checkoutSession.customer : checkoutSession.customer?.id;
        if (userId) {
          await prisma.subscription.upsert({
            where: { userId },
            create: { userId, plan: "PRO", status: "active", stripeCustomerId: customerId },
            update: { plan: "PRO", status: "active" },
          });
        }
      }

      // Two independent referral touchpoints on the same event: the payer
      // may themselves have been referred (grants a NEW reward to whoever
      // invited them), and/or this checkout may have redeemed a reward THEY
      // already earned (the coupon we attached in the checkout route).
      if (checkoutSession.metadata?.userId) {
        await grantReferralRewardIfEligible(checkoutSession.metadata.userId);
      }
      if (checkoutSession.metadata?.referralRewardId) {
        const couponId = await getReferralCouponId();
        await markReferralRewardApplied(checkoutSession.metadata.referralRewardId, couponId);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await upsertFromSubscription(event.data.object as Stripe.Subscription);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

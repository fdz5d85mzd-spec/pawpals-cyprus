import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

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

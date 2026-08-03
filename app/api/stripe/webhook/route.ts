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

  await prisma.subscription.upsert({
    where,
    create: {
      userId: userId!,
      plan,
      status: sub.status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
    },
    update: {
      plan,
      status: sub.status,
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
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

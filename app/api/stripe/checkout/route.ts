import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

// Creates a Stripe Checkout session for the Pro monthly plan. The webhook
// (see app/api/stripe/webhook/route.ts) is what actually flips the user's
// plan to PRO once payment succeeds — this route only starts checkout.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    if (!process.env.STRIPE_PRICE_PRO_MONTHLY) {
      throw new Error("STRIPE_PRICE_PRO_MONTHLY is not set");
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

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRICE_PRO_MONTHLY, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=cancelled`,
      metadata: { userId: user.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("stripe checkout failed", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

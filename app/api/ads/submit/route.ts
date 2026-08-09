import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getAdSlotPriceId } from "@/lib/ad-slot-price";

const schema = z.object({
  slotKey: z.string().min(1),
  position: z.number().int().min(0),
  imageUrl: z.string().url(),
  linkUrl: z.string().url(),
  autoRenew: z.boolean(),
});

// Self-serve advertiser flow: creates the AdSubmission row up front (so we
// have somewhere to attach the Stripe metadata to) and starts a Checkout
// session for the recurring 100€/month ad slot price. The webhook (see
// app/api/stripe/webhook/route.ts) is what actually flips the submission to
// PENDING_APPROVAL once payment succeeds — an admin still has to approve it
// before it goes live as a real AdBanner.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Λείπουν στοιχεία ή δεν είναι έγκυρα." }, { status: 400 });
  }
  const { slotKey, position, imageUrl, linkUrl, autoRenew } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { subscription: true } });
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    // Slot already live, or someone else's submission is already awaiting
    // payment/approval for it — refuse rather than let two advertisers
    // collide on the same box. A stale AWAITING_PAYMENT row of the SAME
    // user's own (they started checkout but never finished it) doesn't
    // block them — clear it out and let them try again.
    const [existingBanner, existingSubmission] = await Promise.all([
      prisma.adBanner.findUnique({ where: { slotKey_position: { slotKey, position } } }),
      prisma.adSubmission.findFirst({
        where: { slotKey, position, status: { in: ["AWAITING_PAYMENT", "PENDING_APPROVAL", "APPROVED"] } },
      }),
    ]);
    if (existingBanner) {
      return NextResponse.json({ error: "Αυτή η θέση δεν είναι πλέον διαθέσιμη." }, { status: 409 });
    }
    if (existingSubmission) {
      if (existingSubmission.status === "AWAITING_PAYMENT" && existingSubmission.advertiserUserId === user.id) {
        await prisma.adSubmission.delete({ where: { id: existingSubmission.id } });
      } else {
        return NextResponse.json({ error: "Αυτή η θέση δεν είναι πλέον διαθέσιμη." }, { status: 409 });
      }
    }

    const submission = await prisma.adSubmission.create({
      data: { slotKey, position, advertiserUserId: user.id, imageUrl, linkUrl, autoRenew },
    });

    let customerId = user.subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } });
      customerId = customer.id;
    }

    const priceId = await getAdSlotPriceId();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { metadata: { purpose: "ad_slot", adSubmissionId: submission.id, userId: user.id } },
      metadata: { purpose: "ad_slot", adSubmissionId: submission.id, userId: user.id },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?ad=pending`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?ad=cancelled`,
    });

    await prisma.adSubmission.update({ where: { id: submission.id }, data: { stripeCustomerId: customerId } });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("ad submit failed", err);
    return NextResponse.json({ error: "Κάτι πήγε στραβά, δοκίμασε ξανά." }, { status: 500 });
  }
}

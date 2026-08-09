import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { REFERRAL_DISCOUNT_PERCENT } from "@/lib/referral";
import { getReferralCouponId } from "@/lib/referral-coupon";
import { commissionCents } from "@/lib/affiliate";
import { getResendClient, DIGEST_FROM } from "@/lib/resend";
import { buildAbandonmentEmail } from "@/lib/cart-abandonment-email";

export const dynamic = "force-dynamic";

// Real cash commission for the affiliate/partner program (separate from the
// referral discount above). Deliberately fed ONLY from invoice.paid for
// subscription plans — Stripe raises an invoice.paid for a brand-new
// subscription's first payment too, so also granting from
// checkout.session.completed would double-credit it. Lifetime is the one
// exception: it's a plain one-time Checkout payment with no Invoice object
// at all, so that case grants directly from checkout.session.completed.
async function grantAffiliateCommission({
  userId,
  amountCents,
  plan,
  stripeEventId,
}: {
  userId: string;
  amountCents: number;
  plan: string;
  stripeEventId: string;
}) {
  if (amountCents <= 0) return;
  const referredUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!referredUser?.referredByAffiliateId) return;

  const affiliate = await prisma.affiliate.findUnique({ where: { id: referredUser.referredByAffiliateId } });
  if (!affiliate) return;

  try {
    await prisma.affiliateCommission.create({
      data: {
        affiliateId: affiliate.id,
        referredUserId: userId,
        amountCents: commissionCents(amountCents, affiliate.commissionPercent),
        plan,
        stripeEventId,
      },
    });
  } catch (err) {
    // Unique constraint on stripeEventId — Stripe's at-least-once delivery
    // means we'll see the same event again; that's expected, not an error.
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) throw err;
  }
}

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

// Self-serve ad-slot subscriptions (see app/api/ads/submit/route.ts) are a
// completely separate product from the Pro plan above — tagged with
// metadata.purpose "ad_slot" on both the Checkout Session and the
// Subscription it creates, specifically so none of this ever touches the
// per-user Subscription table or the Pro-plan affiliate commission logic.
async function handleAdSlotCheckoutCompleted(checkoutSession: Stripe.Checkout.Session) {
  const submissionId = checkoutSession.metadata?.adSubmissionId;
  if (!submissionId || !checkoutSession.subscription) return;

  const subId =
    typeof checkoutSession.subscription === "string" ? checkoutSession.subscription : checkoutSession.subscription.id;
  const sub = await stripe.subscriptions.retrieve(subId);
  const currentPeriodEnd = sub.items.data[0]?.current_period_end;
  const customerId = typeof checkoutSession.customer === "string" ? checkoutSession.customer : checkoutSession.customer?.id;

  const submission = await prisma.adSubmission.update({
    where: { id: submissionId },
    data: {
      status: "PENDING_APPROVAL",
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : undefined,
    },
  });

  // Checkout doesn't accept cancel_at_period_end at session-creation time —
  // applying it right after the subscription exists is the reliable way to
  // honor an advertiser's "don't auto-renew" choice.
  if (!submission.autoRenew) {
    await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true }).catch(() => {});
  }
}

async function handleAdSlotSubscriptionChange(sub: Stripe.Subscription) {
  const submissionId = sub.metadata.adSubmissionId;
  if (!submissionId) return;

  const endedStatuses: Stripe.Subscription.Status[] = ["canceled", "unpaid", "incomplete_expired"];
  if (endedStatuses.includes(sub.status)) {
    // Take the live banner down immediately — but never overwrite a
    // submission an admin already rejected (that cancellation was our own
    // doing, from the reject route, not the advertiser's).
    await prisma.adSubmission.updateMany({
      where: { id: submissionId, status: { not: "REJECTED" } },
      data: { status: "CANCELED" },
    });
    await prisma.adBanner.deleteMany({ where: { sourceSubmissionId: submissionId } });
    return;
  }

  const currentPeriodEnd = sub.items.data[0]?.current_period_end;
  await prisma.adSubmission
    .update({
      where: { id: submissionId },
      data: { currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : undefined },
    })
    .catch(() => {});
}

// Stripe moved an invoice's subscription reference around across API
// versions (top-level `subscription` vs nested under
// `parent.subscription_details`) — checking both keeps this working
// regardless of which shape the pinned apiVersion actually returns.
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const direct = (invoice as unknown as { subscription?: string | { id: string } | null }).subscription;
  if (direct) return typeof direct === "string" ? direct : direct.id;
  const nested = (
    invoice as unknown as { parent?: { subscription_details?: { subscription?: string | { id: string } | null } } }
  ).parent?.subscription_details?.subscription;
  if (nested) return typeof nested === "string" ? nested : nested.id;
  return null;
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

      // Ad-slot purchases are a separate product from the Pro plan — handle
      // and bail out before any of the Pro/referral logic below, none of
      // which applies to this money.
      if (checkoutSession.metadata?.purpose === "ad_slot") {
        await handleAdSlotCheckoutCompleted(checkoutSession);
        break;
      }

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
          await grantAffiliateCommission({
            userId,
            amountCents: checkoutSession.amount_total ?? 0,
            plan: "lifetime",
            stripeEventId: event.id,
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
      const sub = event.data.object as Stripe.Subscription;
      if (sub.metadata?.purpose === "ad_slot") {
        await handleAdSlotSubscriptionChange(sub);
      } else {
        await upsertFromSubscription(sub);
      }
      break;
    }
    case "invoice.paid": {
      // Covers both the first payment of a new monthly/annual subscription
      // and every renewal after it — see grantAffiliateCommission's comment
      // for why lifetime is handled separately above instead of here.
      const invoice = event.data.object as Stripe.Invoice;

      // Ad-slot renewals must never grant Pro-plan affiliate commission —
      // check whether this invoice's subscription belongs to an ad
      // submission before falling through to the Pro-plan logic below.
      const invoiceSubId = getInvoiceSubscriptionId(invoice);
      if (invoiceSubId) {
        const adSubmission = await prisma.adSubmission.findFirst({
          where: { stripeSubscriptionId: invoiceSubId },
          select: { id: true },
        });
        if (adSubmission) break;
      }

      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (customerId && invoice.amount_paid > 0) {
        const sub = await prisma.subscription.findUnique({ where: { stripeCustomerId: customerId } });
        if (sub) {
          await grantAffiliateCommission({
            userId: sub.userId,
            amountCents: invoice.amount_paid,
            plan: "subscription",
            stripeEventId: event.id,
          });
        }
      }
      break;
    }
    case "checkout.session.expired": {
      // A checkout link Stripe itself expires ~24h after creation if never
      // completed — a clean, free abandonment signal with no extra
      // scheduling infra needed. Best-effort: a missing RESEND_API_KEY or a
      // send failure here must never surface as a webhook error to Stripe
      // (it would just retry forever).
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const userId = checkoutSession.metadata?.userId;

      if (checkoutSession.metadata?.purpose === "ad_slot") {
        // Never paid — delete the AWAITING_PAYMENT row rather than leaving
        // it stuck forever, otherwise it'd permanently block anyone
        // (including a retry by the same advertiser) from that slot.
        const submissionId = checkoutSession.metadata?.adSubmissionId;
        if (submissionId) {
          await prisma.adSubmission.deleteMany({ where: { id: submissionId, status: "AWAITING_PAYMENT" } });
        }
        break;
      }

      // This is a Pro-plan-specific nudge email, so it's skipped above for ads.
      if (userId && process.env.RESEND_API_KEY) {
        try {
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user) {
            const { subject, html } = buildAbandonmentEmail();
            await getResendClient().emails.send({ from: DIGEST_FROM, to: user.email, subject, html });
          }
        } catch {
          // Swallow — see comment above.
        }
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

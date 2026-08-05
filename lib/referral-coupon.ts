import { stripe } from "@/lib/stripe";
import { REFERRAL_DISCOUNT_PERCENT } from "@/lib/referral";

// A single shared coupon reused for every referral reward — a fixed,
// auditable percent_off with duration "once" (applies to exactly one
// invoice, i.e. "next month's subscription"). Created once, then just
// retrieved on every later call.
const REFERRAL_COUPON_ID = `referral-${REFERRAL_DISCOUNT_PERCENT}pct-once`;

export async function getReferralCouponId(): Promise<string> {
  try {
    await stripe.coupons.retrieve(REFERRAL_COUPON_ID);
    return REFERRAL_COUPON_ID;
  } catch {
    const coupon = await stripe.coupons.create({
      id: REFERRAL_COUPON_ID,
      percent_off: REFERRAL_DISCOUNT_PERCENT,
      duration: "once",
      name: `Referral reward — ${REFERRAL_DISCOUNT_PERCENT}% off next invoice`,
    });
    return coupon.id;
  }
}

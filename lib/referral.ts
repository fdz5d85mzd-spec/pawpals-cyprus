import crypto from "crypto";

// Real, fixed percentage — no per-referral variability to reason about.
// Applied as a one-cycle Stripe coupon on the referrer's next invoice.
export const REFERRAL_DISCOUNT_PERCENT = 20;

export function generateReferralCode(): string {
  return crypto.randomBytes(5).toString("hex").toUpperCase();
}

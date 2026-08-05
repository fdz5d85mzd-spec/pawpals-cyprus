// Shared between the checkout route (decides whether to attach the coupon)
// and the subscribers-count endpoint (drives the "X spots left" UI copy) —
// keeping the threshold in one place avoids them drifting out of sync.
export const EARLY_BIRD_LIMIT = 100;

export type BillingPlan = "monthly" | "annual" | "lifetime";

export const BILLING_PLANS: Record<BillingPlan, { envVar: string; mode: "subscription" | "payment" }> = {
  monthly: { envVar: "STRIPE_PRICE_PRO_MONTHLY", mode: "subscription" },
  annual: { envVar: "STRIPE_PRICE_PRO_ANNUAL", mode: "subscription" },
  lifetime: { envVar: "STRIPE_PRICE_PRO_LIFETIME", mode: "payment" },
};

export function isBillingPlan(value: unknown): value is BillingPlan {
  return value === "monthly" || value === "annual" || value === "lifetime";
}

import { stripe } from "./stripe";

export interface RevenueSummary {
  mrrCents: number;
  activeSubscriptions: number;
  todayCents: number;
  monthCents: number;
  error?: string;
}

// Best-effort live snapshot from Stripe for the admin dashboard. Wrapped so
// any Stripe hiccup (rate limit, network blip) degrades to a visible "not
// available" instead of taking down /admin — this endpoint is a nice-to-have
// on top of the DB-backed stats, not something the page should ever crash on.
export async function getRevenueSummary(): Promise<RevenueSummary> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const startOfTodayUTC = now - (now % 86400);
    const startOfMonthUTC = Math.floor(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).getTime() / 1000);

    const [subscriptions, todayCharges, monthCharges] = await Promise.all([
      stripe.subscriptions.list({ status: "active", limit: 100 }),
      stripe.charges.list({ created: { gte: startOfTodayUTC }, limit: 100 }),
      stripe.charges.list({ created: { gte: startOfMonthUTC }, limit: 100 }),
    ]);

    let mrrCents = 0;
    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        const amount = item.price.unit_amount ?? 0;
        const interval = item.price.recurring?.interval;
        mrrCents += interval === "year" ? amount / 12 : amount;
      }
    }

    const sumSucceeded = (charges: typeof todayCharges.data) =>
      charges.filter((c) => c.paid && !c.refunded).reduce((s, c) => s + c.amount, 0);

    return {
      mrrCents: Math.round(mrrCents),
      activeSubscriptions: subscriptions.data.length,
      todayCents: sumSucceeded(todayCharges.data),
      monthCents: sumSucceeded(monthCharges.data),
    };
  } catch (err) {
    return {
      mrrCents: 0,
      activeSubscriptions: 0,
      todayCents: 0,
      monthCents: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

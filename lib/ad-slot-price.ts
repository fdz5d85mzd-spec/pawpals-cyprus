import { stripe } from "@/lib/stripe";

// Self-serve ad slots on the site — fixed 100€/month, auto-provisioned in
// Stripe the same way lib/referral-coupon.ts provisions its coupon, so
// nobody has to go click around the Stripe dashboard to set this up.
export const AD_SLOT_MONTHLY_EUR = 100;
const AD_SLOT_PRODUCT_ID = "skorama-ad-slot-monthly";
const AD_SLOT_LOOKUP_KEY = "ad-slot-monthly";

export async function getAdSlotPriceId(): Promise<string> {
  const existing = await stripe.prices.list({ lookup_keys: [AD_SLOT_LOOKUP_KEY], active: true, limit: 1 });
  if (existing.data[0]) return existing.data[0].id;

  let product;
  try {
    product = await stripe.products.retrieve(AD_SLOT_PRODUCT_ID);
  } catch {
    product = await stripe.products.create({
      id: AD_SLOT_PRODUCT_ID,
      name: "Διαφημιστική θέση στο Skorama",
    });
  }

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: AD_SLOT_MONTHLY_EUR * 100,
    currency: "eur",
    recurring: { interval: "month" },
    lookup_key: AD_SLOT_LOOKUP_KEY,
  });
  return price.id;
}

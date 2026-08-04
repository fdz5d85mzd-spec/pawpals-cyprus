import Stripe from "stripe";

// Disabling keep-alive on Node's http.Agent (the previous attempt here)
// didn't clear the "StripeConnectionError: An error occurred with our
// connection to Stripe" errors seen in production — the failures kept
// happening even across retries, so it wasn't just a stale-socket blip.
// Switching to Stripe's fetch-based HTTP client sidesteps Node's raw
// http/https module entirely (it uses the platform's native fetch/undici
// instead), which is Stripe's own recommended client for serverless
// runtimes like Vercel functions.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  // The account has Managed Payments enabled, which Stripe only supports on
  // API versions >= 2025-03-31 ("basil") — 2024-06-20 rejected every
  // checkout session with StripeInvalidRequestError.
  apiVersion: "2026-07-29.dahlia",
  httpClient: Stripe.createFetchHttpClient(),
  maxNetworkRetries: 2,
});

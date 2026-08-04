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
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
  maxNetworkRetries: 2,
});

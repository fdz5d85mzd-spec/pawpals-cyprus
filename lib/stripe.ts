import Stripe from "stripe";
import https from "https";

// Serverless platforms (Vercel) freeze/thaw function containers, which can
// leave keep-alive sockets stale and surface as "StripeConnectionError:
// An error occurred with our connection to Stripe" on the first request
// after a cold start. Disabling keep-alive and allowing a couple of
// automatic retries avoids that class of transient failure.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-06-20",
  httpAgent: new https.Agent({ keepAlive: false }),
  maxNetworkRetries: 2,
});

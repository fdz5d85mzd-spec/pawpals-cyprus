import { Resend } from "resend";

// Constructed lazily (not at module load) so a missing RESEND_API_KEY only
// breaks the one route that actually tries to send mail, instead of
// crashing the build — the Resend SDK throws immediately in its
// constructor if the key is empty.
export function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY ?? "");
}

// Falls back to Resend's own onboarding domain if skorama.xyz isn't showing
// "Verified" yet in the Resend dashboard — swap RESEND_FROM_EMAIL once it is.
export const DIGEST_FROM = process.env.RESEND_FROM_EMAIL ?? "Skorama <onboarding@resend.dev>";

import webpush from "web-push";

// Lazy factory (not a module-level singleton) — same reasoning as
// lib/resend.ts: constructing this eagerly at import time would crash
// Next.js's build-time page-data collection when the VAPID env vars are
// absent (e.g. a fresh clone that hasn't set them up yet).
export function getWebPushClient() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:info@skorama.xyz",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
    process.env.VAPID_PRIVATE_KEY ?? ""
  );
  return webpush;
}

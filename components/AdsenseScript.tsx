"use client";

import Script from "next/script";
import { useSession } from "next-auth/react";

const CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

// Loads Google AdSense's Auto Ads script — Google decides placement
// automatically once the site is approved, so there's no per-slot code to
// maintain here. Skipped entirely for Pro users: no ads is a real perk of
// paying, and it avoids serving/tracking scripts to subscribers who already
// pay for the product.
export function AdsenseScript() {
  const { data: session } = useSession();
  if (!CLIENT_ID || session?.user?.plan === "PRO") return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

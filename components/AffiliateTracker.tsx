"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AFFILIATE_COOKIE, AFFILIATE_COOKIE_MAX_AGE_DAYS } from "@/lib/affiliate";

function Tracker() {
  const searchParams = useSearchParams();
  const code = searchParams.get("aff");

  useEffect(() => {
    if (!code) return;
    document.cookie = `${AFFILIATE_COOKIE}=${code};path=/;max-age=${AFFILIATE_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60}`;
    fetch("/api/affiliate/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => {});
  }, [code]);

  return null;
}

// useSearchParams needs a Suspense boundary or Next bails the whole route
// to client-only rendering — this stays a no-op wrapper so it never blocks
// the rest of the page from rendering.
export function AffiliateTracker() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}

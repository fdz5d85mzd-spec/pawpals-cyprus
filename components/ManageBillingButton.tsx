"use client";

import { useState } from "react";

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (data.url) window.location.href = data.url;
  }

  return (
    <button
      onClick={openPortal}
      disabled={loading}
      className="w-full text-xs font-mono font-bold px-4 py-2.5 rounded-full bg-lime text-bg disabled:opacity-60"
    >
      {loading ? "..." : "Διαχείριση συνδρομής"}
    </button>
  );
}

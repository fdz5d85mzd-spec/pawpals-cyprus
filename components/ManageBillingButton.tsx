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
    <button onClick={openPortal} disabled={loading} className="btn-primary w-full">
      {loading ? "..." : "Διαχείριση συνδρομής"}
    </button>
  );
}

"use client";

import { useState } from "react";

export function MarkPaidButton({ affiliateId }: { affiliateId: string }) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function markPaid() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mark-commission-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId }),
      });
      if (res.ok) setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) return <span className="text-[10px] text-lime font-bold">Πληρώθηκε ✓</span>;

  return (
    <button onClick={markPaid} disabled={loading} className="text-[10px] font-bold text-dim hover:text-lime underline">
      {loading ? "..." : "Σήμανση ως πληρωμένο"}
    </button>
  );
}

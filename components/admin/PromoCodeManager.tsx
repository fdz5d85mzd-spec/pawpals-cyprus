"use client";

import { useState } from "react";

interface PromoCode {
  code: string;
  redeemedAt: string | null;
  redeemedBy: { email: string } | null;
}

export function PromoCodeManager({ initialCodes }: { initialCodes: PromoCode[] }) {
  const [codes, setCodes] = useState(initialCodes);
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      if (!res.ok) return;
      const listRes = await fetch("/api/admin/promo-codes");
      const { codes: fresh } = await listRes.json();
      setCodes(fresh);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <input
          type="number"
          min={1}
          max={50}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-16 text-xs bg-surface2 border border-border rounded px-2 py-1.5 text-ink"
        />
        <button onClick={generate} disabled={loading} className="btn-primary !py-1.5 text-xs">
          {loading ? "..." : "Δημιουργία κωδικών"}
        </button>
      </div>
      {codes.length > 0 && (
        <div className="card overflow-x-auto mb-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[9px] uppercase tracking-wide font-mono text-dim border-b border-border/60">
                <th className="text-left py-2 px-3">Κωδικός</th>
                <th className="text-left py-2 px-3">Κατάσταση</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.code} className="border-b border-border/40 last:border-0">
                  <td className="py-2 px-3 font-mono text-ink">{c.code}</td>
                  <td className="py-2 px-3">
                    {c.redeemedBy ? (
                      <span className="text-dim">Χρησιμοποιήθηκε ({c.redeemedBy.email})</span>
                    ) : (
                      <span className="text-lime font-bold">Διαθέσιμος</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

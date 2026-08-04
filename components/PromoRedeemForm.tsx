"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function PromoRedeemForm() {
  const { update } = useSession();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/promo/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Κάτι πήγε στραβά.");
      return;
    }
    setDone(true);
    await update();
    router.refresh();
  }

  if (done) {
    return <div className="text-xs text-lime font-bold">Το Pro ενεργοποιήθηκε ✓</div>;
  }

  return (
    <form onSubmit={submit}>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Promo code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="input flex-1"
        />
        <button type="submit" disabled={loading || !code.trim()} className="btn-secondary shrink-0">
          {loading ? "..." : "Ενεργοποίηση"}
        </button>
      </div>
      {error && <div className="text-[10px] text-rose mt-1.5">{error}</div>}
    </form>
  );
}

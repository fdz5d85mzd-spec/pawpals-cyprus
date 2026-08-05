"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AffiliateActivateButton({ label }: { label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function activate() {
    setLoading(true);
    try {
      await fetch("/api/affiliate/activate", { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={activate} disabled={loading} className="btn-primary">
      {loading ? "..." : label}
    </button>
  );
}

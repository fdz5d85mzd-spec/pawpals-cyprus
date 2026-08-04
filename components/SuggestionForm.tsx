"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SuggestionForm() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 3) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Κάτι πήγε στραβά, δοκίμασε ξανά.");
      return;
    }
    setBody("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card p-5">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Τι θα ήθελες να δεις στο Skorama;"
        rows={3}
        className="input resize-none mb-3"
      />
      {error && <div className="text-xs text-rose mb-2">{error}</div>}
      <button type="submit" disabled={loading || body.trim().length < 3} className="btn-primary">
        {loading ? "..." : "Αποστολή εισήγησης"}
      </button>
    </form>
  );
}

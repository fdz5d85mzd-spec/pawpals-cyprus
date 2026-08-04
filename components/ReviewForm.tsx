"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

export function ReviewForm({ initialRating, initialBody }: { initialRating?: number; initialBody?: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(initialBody ?? "");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setLoading(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, body: body || undefined }),
    });
    setLoading(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="card p-5">
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={26}
              className={(hover || rating) >= n ? "fill-lime text-lime" : "text-dim"}
            />
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Πες μας τη γνώμη σου (προαιρετικό)..."
        rows={2}
        className="input resize-none mb-3"
      />
      <button type="submit" disabled={loading || rating === 0} className="btn-primary">
        {loading ? "..." : done ? "Ενημερώθηκε ✓" : "Υποβολή αξιολόγησης"}
      </button>
    </form>
  );
}

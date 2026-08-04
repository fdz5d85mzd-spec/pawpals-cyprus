"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MessageCircle } from "lucide-react";
import { Eyebrow } from "./ui";

export interface CommentItem {
  id: string;
  body: string;
  createdAt: string;
  userName: string;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "μόλις τώρα";
  if (diff < 3600) return `${Math.floor(diff / 60)}λ πριν`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}ω πριν`;
  return `${Math.floor(diff / 86400)}μ πριν`;
}

export function Comments({ fixtureId, initialComments }: { fixtureId: number; initialComments: CommentItem[] }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fixtureId, body }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Κάτι πήγε στραβά, δοκίμασε ξανά.");
      return;
    }
    const created = await res.json();
    setComments((c) => [created, ...c]);
    setBody("");
    router.refresh();
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-2.5">
        <MessageCircle size={13} className="text-dim" />
        <Eyebrow>Σχόλια ({comments.length})</Eyebrow>
      </div>

      {session ? (
        <form onSubmit={submit} className="mb-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Γράψε το σχόλιό σου για αυτόν τον αγώνα..."
            rows={2}
            className="input resize-none mb-2"
          />
          {error && <div className="text-xs text-rose mb-2">{error}</div>}
          <button type="submit" disabled={loading || !body.trim()} className="btn-primary">
            {loading ? "..." : "Δημοσίευση"}
          </button>
        </form>
      ) : (
        <div className="card p-4 mb-4 text-xs text-muted">
          <a href="/login" className="text-lime font-bold">
            Συνδέσου
          </a>{" "}
          για να σχολιάσεις αυτόν τον αγώνα.
        </div>
      )}

      <div className="space-y-2">
        {comments.map((c) => (
          <div key={c.id} className="card p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-ink">{c.userName}</span>
              <span className="text-[10px] text-dim font-mono">{timeAgo(c.createdAt)}</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

interface Submission {
  id: string;
  slotKey: string;
  position: number;
  imageUrl: string;
  linkUrl: string;
  autoRenew: boolean;
  advertiserEmail: string;
  createdAt: string;
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

export function AdSubmissionReview({ submission }: { submission: Submission }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  async function act(action: "approve" | "reject") {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/ad-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: submission.id, action, reason: action === "reject" ? reason : undefined }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-3.5 space-y-2.5">
      <div className="flex items-center justify-between text-[10px] font-mono text-dim uppercase tracking-wide">
        <span>
          {submission.slotKey} #{submission.position + 1}
        </span>
        <span>{submission.autoRenew ? "Αυτόματη ανανέωση" : "Χωρίς ανανέωση"}</span>
      </div>
      <div className="text-xs text-ink font-bold">{submission.advertiserEmail}</div>

      <div className="rounded overflow-hidden border border-border max-w-xs">
        {isVideoUrl(submission.imageUrl) ? (
          <video src={submission.imageUrl} className="w-full h-auto block" muted loop autoPlay playsInline />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={submission.imageUrl} alt="" className="w-full h-auto block" />
        )}
      </div>
      <a href={submission.linkUrl} target="_blank" rel="noopener noreferrer" className="block text-[11px] text-lime underline truncate">
        {submission.linkUrl}
      </a>

      {rejecting ? (
        <div className="space-y-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Λόγος απόρριψης (προαιρετικό)"
            className="w-full text-xs bg-surface2 border border-border rounded px-2 py-1.5 text-ink"
          />
          <div className="flex gap-2">
            <button onClick={() => act("reject")} disabled={busy} className="btn-secondary flex-1 !py-1.5 text-xs text-rose">
              Επιβεβαίωση απόρριψης
            </button>
            <button onClick={() => setRejecting(false)} disabled={busy} className="btn-secondary !py-1.5 text-xs">
              Άκυρο
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => act("approve")}
            disabled={busy}
            className="btn-primary flex-1 !py-1.5 text-xs flex items-center justify-center gap-1"
          >
            <Check size={13} /> Έγκριση
          </button>
          <button
            onClick={() => setRejecting(true)}
            disabled={busy}
            className="btn-secondary flex-1 !py-1.5 text-xs text-rose flex items-center justify-center gap-1"
          >
            <X size={13} /> Απόρριψη
          </button>
        </div>
      )}
    </div>
  );
}

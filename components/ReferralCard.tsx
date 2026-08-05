"use client";

import { useState } from "react";
import { Copy, Check, Facebook, MessageCircle } from "lucide-react";
import { REFERRAL_DISCOUNT_PERCENT } from "@/lib/referral";

export function ReferralCard({
  referralCode,
  appliedRewards,
  pendingRewards,
}: {
  referralCode: string;
  appliedRewards: number;
  pendingRewards: number;
}) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://skorama.xyz";
  const link = `${origin}/register?ref=${referralCode}`;
  const shareText = `Κάνε δωρεάν εγγραφή στο Skorama (στατιστικές προβλέψεις ποδοσφαίρου) με το link μου:`;

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="card p-5">
      <div className="text-xs text-muted mb-1">Πρόσκλησε φίλους</div>
      <p className="text-[11px] text-dim leading-relaxed mb-3">
        Κάθε φίλος που κάνει εγγραφή με το link σου και γίνει συνδρομητής Pro σού χαρίζει{" "}
        <span className="text-lime font-bold">{REFERRAL_DISCOUNT_PERCENT}% έκπτωση</span> στην επόμενη μηνιαία
        χρέωσή σου.
      </p>

      <div className="flex items-center gap-1.5 mb-3">
        <input readOnly value={link} className="input flex-1 text-[10px]" onFocus={(e) => e.target.select()} />
        <button onClick={copyLink} className="btn-secondary shrink-0 px-3" aria-label="Αντιγραφή link">
          {copied ? <Check size={14} className="text-lime" /> : <Copy size={14} />}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-[11px]"
        >
          <Facebook size={13} /> Facebook
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${link}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-[11px]"
        >
          <MessageCircle size={13} /> WhatsApp
        </a>
      </div>

      {(appliedRewards > 0 || pendingRewards > 0) && (
        <div className="text-[10px] text-muted pt-3 border-t border-border/60">
          {appliedRewards > 0 && (
            <div>
              ✓ {appliedRewards} έκπτωση{appliedRewards === 1 ? "" : "εις"} {REFERRAL_DISCOUNT_PERCENT}% ήδη
              εφαρμοσμένη{appliedRewards === 1 ? "" : "ες"}
            </div>
          )}
          {pendingRewards > 0 && <div>⏳ {pendingRewards} σε αναμονή — θα εφαρμοστεί στην επόμενη συνδρομή σου</div>}
        </div>
      )}
    </div>
  );
}

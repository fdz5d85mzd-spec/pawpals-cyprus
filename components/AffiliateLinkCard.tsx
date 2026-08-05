"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, Facebook, MessageCircle } from "lucide-react";

export function AffiliateLinkCard({ code }: { code: string }) {
  const t = useTranslations("affiliate");
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://skorama.xyz";
  const link = `${origin}/register?aff=${code}`;

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="card p-5">
      <div className="text-xs text-muted mb-2">{t("linkLabel")}</div>
      <div className="flex items-center gap-1.5 mb-3">
        <input readOnly value={link} className="input flex-1 text-[10px]" onFocus={(e) => e.target.select()} />
        <button onClick={copyLink} className="btn-secondary shrink-0 px-3" aria-label={t("copy")}>
          {copied ? <Check size={14} className="text-lime" /> : <Copy size={14} />}
        </button>
      </div>
      <div className="flex gap-2">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-[11px]"
        >
          <Facebook size={13} /> Facebook
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${t("shareText")} ${link}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-[11px]"
        >
          <MessageCircle size={13} /> WhatsApp
        </a>
      </div>
    </div>
  );
}

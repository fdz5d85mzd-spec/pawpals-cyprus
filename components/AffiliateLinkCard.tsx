"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { Copy, Check, Facebook, MessageCircle, Download } from "lucide-react";

export function AffiliateLinkCard({ code }: { code: string }) {
  const t = useTranslations("affiliate");
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://skorama.xyz";
  const link = `${origin}/register?aff=${code}`;

  // Every affiliate's QR encodes their OWN ?aff=CODE link, so whoever scans
  // it gets the same 30-day attribution cookie as clicking the text link —
  // signups/renewals from that scan get credited to this affiliate.
  useEffect(() => {
    QRCode.toDataURL(link, { width: 480, margin: 2, color: { dark: "#0b0b0d", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [link]);

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
          href={`https://wa.me/?text=${encodeURIComponent(`${t("shareText")} ${link}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-[11px]"
        >
          <MessageCircle size={13} /> WhatsApp
        </a>
      </div>

      {qrDataUrl && (
        <div className="pt-4 border-t border-border/60 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR code" width={96} height={96} className="rounded bg-white p-1.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted mb-2">{t("qrLabel")}</div>
            <a
              href={qrDataUrl}
              download={`skorama-qr-${code}.png`}
              className="btn-secondary inline-flex items-center gap-1.5 text-[11px]"
            >
              <Download size={13} /> {t("downloadQr")}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

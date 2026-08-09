"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { X, Handshake } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { DEFAULT_COMMISSION_PERCENT } from "@/lib/affiliate";

const DISMISS_KEY = "skorama_affiliate_popup_dismissed_at";
const RESHOW_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SHOW_DELAY_MS = 8000;
const HIDDEN_PATHS = ["/live", "/login", "/register", "/affiliate"];

export function AffiliatePopup() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const t = useTranslations("affiliate");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Admins can't activate the affiliate program (see /affiliate page and
    // the activate API) — no point pitching it to them.
    if (status !== "authenticated" || session?.user?.isAdmin || HIDDEN_PATHS.includes(pathname)) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (Date.now() - dismissedAt < RESHOW_AFTER_MS) return;

    let cancelled = false;
    fetch("/api/affiliate/status")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || d.isAffiliate) return;
        const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
        return () => clearTimeout(timer);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.isAdmin, pathname]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70" onClick={dismiss}>
      <div
        className="relative w-full max-w-sm card p-6 border-lime/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-lime/20" style={{ transform: "rotate(24deg)" }} />
        <button
          onClick={dismiss}
          aria-label="close"
          className="absolute top-3 right-3 text-dim hover:text-ink transition-colors"
        >
          <X size={18} />
        </button>

        <div className="relative flex items-center gap-1.5 mb-3 text-[10px] tracking-[0.2em] uppercase font-mono text-lime">
          <Handshake size={12} />
          {t("kicker")}
        </div>
        <h2 className="relative font-display text-2xl font-extrabold text-ink tracking-tight mb-2">
          {t("popupTitle", { percent: DEFAULT_COMMISSION_PERCENT })}
        </h2>
        <p className="relative text-sm text-muted mb-5">{t("popupBody")}</p>

        <Link href="/affiliate" onClick={dismiss} className="btn-primary w-full text-center block">
          {t("popupCta")}
        </Link>
      </div>
    </div>
  );
}

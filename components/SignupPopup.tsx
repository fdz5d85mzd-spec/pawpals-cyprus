"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { X, Sparkles } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";

const DISMISS_KEY = "skorama_signup_popup_dismissed_at";
const RESHOW_AFTER_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const SHOW_DELAY_MS = 5000;
const HIDDEN_PATHS = ["/live", "/login", "/register"];

export function SignupPopup() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const t = useTranslations("signupPopup");
  const tPricing = useTranslations("pricing");
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status !== "unauthenticated" || HIDDEN_PATHS.includes(pathname)) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (Date.now() - dismissedAt < RESHOW_AFTER_MS) return;

    let cancelled = false;
    fetch("/api/subscribers-count")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || d.earlyBirdSpotsLeft <= 0) return;
        setSpotsLeft(d.earlyBirdSpotsLeft);
        const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
        return () => clearTimeout(timer);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [status, pathname]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible || spotsLeft === null) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70" onClick={dismiss}>
      <div
        className="relative w-full max-w-sm card p-6 border-lime/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-lime/20" style={{ transform: "rotate(24deg)" }} />
        <button
          onClick={dismiss}
          aria-label={t("close")}
          className="absolute top-3 right-3 text-dim hover:text-ink transition-colors"
        >
          <X size={18} />
        </button>

        <div className="relative flex items-center gap-1.5 mb-3 text-[10px] tracking-[0.2em] uppercase font-mono text-lime">
          <Sparkles size={12} />
          {t("kicker")}
        </div>
        <h2 className="relative font-display text-2xl font-extrabold text-ink tracking-tight mb-2">{t("title")}</h2>
        <p className="relative text-sm text-muted mb-1.5">{t("body")}</p>
        <p className="relative text-xs text-lime font-bold mb-5">{tPricing("earlyBird", { count: spotsLeft })}</p>

        <div className="relative flex gap-2">
          <Link href="/register" onClick={dismiss} className="btn-primary flex-1 text-center">
            {t("cta")}
          </Link>
          <button onClick={dismiss} className="btn-secondary px-4 text-xs">
            {t("dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}

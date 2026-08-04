"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Check, Crown } from "lucide-react";
import { PromoRedeemForm } from "@/components/PromoRedeemForm";

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("pricing");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const freeFeatures = t.raw("freeFeatures") as string[];
  const proFeatures = t.raw("proFeatures") as string[];

  async function upgrade() {
    if (!session) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? t("genericError"));
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(t("genericError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-5 pt-5 pb-16">
      <div className="text-[10px] tracking-[0.2em] uppercase font-mono mb-1.5 text-dim animate-fade-up">{t("kicker")}</div>
      <h1 className="font-display text-2xl sm:text-4xl mb-4 font-extrabold text-ink tracking-tight animate-fade-up" style={{ animationDelay: "60ms" }}>
        {t("title")}
      </h1>

      <div className="grid grid-cols-1 gap-3">
        <div className="card p-5 animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="text-[10px] uppercase tracking-wide font-mono mb-2 text-dim">{t("free")}</div>
          <div className="font-display text-3xl mb-3 text-ink font-extrabold">0€</div>
          <ul className="text-xs space-y-2 text-muted">
            {freeFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check size={14} className="text-dim mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5 relative overflow-hidden border-lime/50 animate-fade-up" style={{ animationDelay: "180ms" }}>
          <div className="absolute top-0 right-0 bg-lime text-bg text-[9px] font-bold font-mono px-3 py-1 rounded-bl-xl flex items-center gap-1">
            <Crown size={10} /> {t("popular")}
          </div>
          <div className="text-[10px] uppercase tracking-wide font-mono mb-3 text-lime">{t("pro")}</div>
          <div className="font-display text-3xl mb-5 text-ink font-extrabold">
            6,99€<span className="text-sm text-muted font-normal">{t("perMonth")}</span>
          </div>
          <ul className="text-xs space-y-2.5 mb-6 text-muted">
            {proFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check size={14} className="text-lime mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button onClick={upgrade} disabled={loading} className="btn-primary w-full">
            {loading ? t("upgradeLoading") : t("upgradeButton")}
          </button>
          {error && <div className="mt-2 text-[11px] text-red-400">{error}</div>}

          <div className="mt-4 pt-4 border-t border-border/60">
            <div className="text-[10px] text-muted mb-2">{t("promoQuestion")}</div>
            {session ? (
              <PromoRedeemForm />
            ) : (
              <Link href="/login" className="text-xs text-lime font-bold">
                {t("promoLoginPrompt")}
              </Link>
            )}
          </div>
        </div>
      </div>

      <p className="mt-8 text-[11px] leading-relaxed text-dim">
        {t("legalNotice")}{" "}
        <Link href="/terms" className="text-lime font-bold">
          {t("termsLink")}
        </Link>
        .
      </p>
    </div>
  );
}

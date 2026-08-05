"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Check, Crown, Flame, Users } from "lucide-react";
import { PromoRedeemForm } from "@/components/PromoRedeemForm";
import type { BillingPlan } from "@/lib/pricing";

const PLAN_PRICE: Record<BillingPlan, { amount: string }> = {
  monthly: { amount: "6,99€" },
  annual: { amount: "59,99€" },
  lifetime: { amount: "249€" },
};

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("pricing");
  const [billingPlan, setBillingPlan] = useState<BillingPlan>("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subCount, setSubCount] = useState<number | null>(null);
  const [earlyBirdSpotsLeft, setEarlyBirdSpotsLeft] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/subscribers-count")
      .then((r) => r.json())
      .then((d) => {
        setSubCount(d.count);
        setEarlyBirdSpotsLeft(d.earlyBirdSpotsLeft);
      })
      .catch(() => {});
  }, []);

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
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: billingPlan }),
      });
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
    <div className="max-w-4xl mx-auto px-5 pt-5 pb-16">
      <div className="text-[10px] tracking-[0.2em] uppercase font-mono mb-1.5 text-dim animate-fade-up">{t("kicker")}</div>
      <h1 className="font-display text-2xl sm:text-4xl mb-2 font-extrabold text-ink tracking-tight animate-fade-up" style={{ animationDelay: "60ms" }}>
        {t("title")}
      </h1>
      {subCount !== null && subCount > 0 && (
        <div className="flex items-center gap-1.5 mb-4 text-[11px] text-dim">
          <Users size={12} />
          <span>{t("subscriberCount", { count: subCount })}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:items-start">
        <div className="card p-5 lg:p-6 animate-fade-up" style={{ animationDelay: "120ms" }}>
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

        <div className="card p-5 lg:p-6 relative overflow-hidden border-lime/50 animate-fade-up" style={{ animationDelay: "180ms" }}>
          <div className="absolute top-0 right-0 bg-lime text-bg text-[9px] font-bold font-mono px-3 py-1 rounded-bl-xl flex items-center gap-1">
            <Crown size={10} /> {t("popular")}
          </div>
          <div className="text-[10px] uppercase tracking-wide font-mono mb-3 text-lime">{t("pro")}</div>

          <div className="flex gap-1 mb-4 bg-surface2 p-1">
            {(["monthly", "annual", "lifetime"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setBillingPlan(p)}
                className={`flex-1 text-[9px] font-bold uppercase tracking-wide py-1.5 transition-colors ${
                  billingPlan === p ? "bg-lime text-bg" : "text-muted hover:text-ink"
                }`}
              >
                {t(`plan.${p}`)}
              </button>
            ))}
          </div>

          <div className="font-display text-3xl mb-1 text-ink font-extrabold">
            {PLAN_PRICE[billingPlan].amount}
            <span className="text-sm text-muted font-normal">{t(`planSuffix.${billingPlan}`)}</span>
          </div>
          {billingPlan === "annual" && <div className="text-[10px] text-lime font-bold mb-3">{t("annualSavings")}</div>}
          {billingPlan === "lifetime" && <div className="text-[10px] text-lime font-bold mb-3">{t("lifetimeNote")}</div>}
          {billingPlan === "monthly" && <div className="mb-3" />}

          {earlyBirdSpotsLeft !== null && earlyBirdSpotsLeft > 0 && (
            <div className="flex items-center gap-1.5 mb-5 px-2.5 py-1.5 bg-lime/10 border border-lime/30 text-[11px] text-lime font-bold">
              <Flame size={12} />
              {t("earlyBird", { count: earlyBirdSpotsLeft })}
            </div>
          )}
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

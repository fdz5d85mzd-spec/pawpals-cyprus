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
  const [loadingPlan, setLoadingPlan] = useState<BillingPlan | null>(null);
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

  async function upgrade(plan: BillingPlan) {
    if (!session) {
      router.push("/login");
      return;
    }
    setLoadingPlan(plan);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
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
      setLoadingPlan(null);
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:items-start">
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

        {(["monthly", "annual", "lifetime"] as const).map((plan, i) => (
          <div
            key={plan}
            className={`card p-5 lg:p-6 relative overflow-hidden animate-fade-up flex flex-col ${
              plan === "annual" ? "border-lime/50" : ""
            }`}
            style={{ animationDelay: `${180 + i * 60}ms` }}
          >
            {plan === "annual" && (
              <div className="absolute top-0 right-0 bg-lime text-bg text-[9px] font-bold font-mono px-3 py-1 rounded-bl-xl flex items-center gap-1">
                <Crown size={10} /> {t("popular")}
              </div>
            )}
            <div className="text-[10px] uppercase tracking-wide font-mono mb-3 text-lime">
              {t("pro")} · {t(`plan.${plan}`)}
            </div>

            <div className="font-display text-3xl mb-1 text-ink font-extrabold">
              {PLAN_PRICE[plan].amount}
              <span className="text-sm text-muted font-normal">{t(`planSuffix.${plan}`)}</span>
            </div>
            {plan === "annual" && <div className="text-[10px] text-lime font-bold mb-3">{t("annualSavings")}</div>}
            {plan === "lifetime" && <div className="text-[10px] text-lime font-bold mb-3">{t("lifetimeNote")}</div>}
            {plan === "monthly" && <div className="mb-3" />}

            {plan === "annual" && earlyBirdSpotsLeft !== null && earlyBirdSpotsLeft > 0 && (
              <div className="flex items-center gap-1.5 mb-5 px-2.5 py-1.5 bg-lime/10 border border-lime/30 text-[11px] text-lime font-bold">
                <Flame size={12} />
                {t("earlyBird", { count: earlyBirdSpotsLeft })}
              </div>
            )}
            <ul className="text-xs space-y-2.5 mb-6 text-muted grow">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check size={14} className="text-lime mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={() => upgrade(plan)} disabled={loadingPlan !== null} className="btn-primary w-full">
              {loadingPlan === plan ? t("upgradeLoading") : t("upgradeButton")}
            </button>
          </div>
        ))}
      </div>
      {error && <div className="mt-3 text-[11px] text-red-400">{error}</div>}

      <div className="mt-6 card p-5 lg:p-6 max-w-md animate-fade-up" style={{ animationDelay: "360ms" }}>
        <div className="text-[10px] text-muted mb-2">{t("promoQuestion")}</div>
        {session ? (
          <PromoRedeemForm />
        ) : (
          <Link href="/login" className="text-xs text-lime font-bold">
            {t("promoLoginPrompt")}
          </Link>
        )}
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

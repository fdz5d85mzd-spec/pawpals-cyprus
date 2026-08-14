import { Activity, Gauge, Home, ShieldCheck, TrendingUp, Users } from "lucide-react";
import type { FormResult } from "@/lib/model";
import { getTranslations } from "next-intl/server";

interface TeamExplanationInput {
  name: string;
  form: FormResult[];
  leaguePos: number | null;
  avgGoalsFor: number | null;
  avgGoalsAgainst: number | null;
  playerStatuses: string[];
}

function formScore(form: FormResult[]) {
  if (!form.length) return null;
  return form.reduce((total, result) => total + (result === "W" ? 3 : result === "D" ? 1 : 0), 0);
}

export async function ModelExplanation({
  home,
  away,
  lambdaHome,
  lambdaAway,
  confidence,
}: {
  home: TeamExplanationInput;
  away: TeamExplanationInput;
  lambdaHome: number;
  lambdaAway: number;
  confidence: number;
}) {
  const t = await getTranslations("upgrade");
  const homeForm = formScore(home.form);
  const awayForm = formScore(away.form);
  const factors = [
    {
      icon: Home,
      label: t("homeAdvantage"),
      value: home.name,
      detail: t("homeAdvantageBody"),
    },
    {
      icon: Activity,
      label: t("recentForm"),
      value: homeForm != null && awayForm != null ? t("formPoints", { home: homeForm, away: awayForm }) : t("partialData"),
      detail: t("formDetail", { home: home.name, away: away.name }),
    },
    {
      icon: TrendingUp,
      label: t("attack"),
      value:
        home.avgGoalsFor != null && away.avgGoalsFor != null
          ? t("goalsPerMatch", { home: home.avgGoalsFor.toFixed(2), away: away.avgGoalsFor.toFixed(2) })
          : t("missingData"),
      detail: t("attackDetail"),
    },
    {
      icon: Gauge,
      label: t("expectedGoals"),
      value: `${lambdaHome.toFixed(2)}–${lambdaAway.toFixed(2)} xG model`,
      detail: t("expectedGoalsDetail"),
    },
  ];
  const reportedAbsences = [...home.playerStatuses, ...away.playerStatuses].filter((status) => status !== "fit");

  return (
    <section className="card mb-6 p-5" aria-labelledby="model-explanation-title">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-lime">{t("explainable")}</div>
          <h2 id="model-explanation-title" className="mt-1 font-display text-xl font-extrabold text-ink">{t("whyModel")}</h2>
        </div>
        <div className="rounded-full border border-lime/25 bg-lime/10 px-3 py-1.5 text-[10px] font-bold text-lime">
          {t("confidence")} {confidence}%
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {factors.map(({ icon: Icon, label, value, detail }) => (
          <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-muted"><Icon size={13} className="text-lime" />{label}</div>
            <div className="mt-2 text-sm font-bold text-ink">{value}</div>
            <p className="mt-1 text-[11px] leading-relaxed text-dim">{detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
        {reportedAbsences.length ? <Users size={15} className="mt-0.5 shrink-0 text-amber" /> : <ShieldCheck size={15} className="mt-0.5 shrink-0 text-green" />}
        <div>
          <div className="text-xs font-bold text-ink">{t("availability")}</div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            {reportedAbsences.length
              ? t("reportedAbsences", { count: reportedAbsences.length })
              : t("noAbsences")}
          </p>
        </div>
      </div>
    </section>
  );
}

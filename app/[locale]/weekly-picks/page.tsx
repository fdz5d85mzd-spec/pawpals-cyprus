import { getTranslations } from "next-intl/server";
import { CalendarRange, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { presentPrediction } from "@/lib/present";
import { buildMatchNarrative } from "@/lib/narrative";
import type { FormResult } from "@/lib/model";

export const dynamic = "force-dynamic";

function pickLabelFor(model: { winHome: number; draw: number; winAway: number }, homeName: string, awayName: string, drawLabel: string) {
  if (model.winHome >= model.draw && model.winHome >= model.winAway) return { label: homeName, pct: model.winHome };
  if (model.winAway >= model.draw && model.winAway >= model.winHome) return { label: awayName, pct: model.winAway };
  return { label: drawLabel, pct: model.draw };
}

export default async function WeeklyPicksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("weeklyPicks");
  const tHome = await getTranslations("home");

  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const fixtures = await prisma.fixture.findMany({
    where: { kickoff: { gte: new Date(), lte: in7Days }, prediction: { isNot: null } },
    include: { homeTeam: true, awayTeam: true, prediction: true },
    orderBy: { kickoff: "asc" },
    take: 40,
  });

  const withModel = fixtures
    .filter((f) => f.prediction)
    .map((f) => ({ fixture: f, model: presentPrediction(f.prediction!) }))
    .sort((a, b) => b.model.confidence - a.model.confidence)
    .slice(0, 4);

  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-16">
      <div className="flex items-center gap-2 mb-2 animate-fade-up">
        <CalendarRange size={16} className="text-lime" />
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-dim">{t("kicker")}</span>
      </div>
      <h1 className="font-display text-4xl mb-2 font-extrabold text-ink tracking-tight animate-fade-up" style={{ animationDelay: "60ms" }}>
        {t("title")}
      </h1>
      <p className="text-sm text-muted mb-8 animate-fade-up" style={{ animationDelay: "120ms" }}>
        {t("subtitle")}
      </p>

      {withModel.length === 0 ? (
        <div className="card p-6 text-center text-xs text-dim">{t("empty")}</div>
      ) : (
        <div className="space-y-3">
          {withModel.map(({ fixture: f, model }) => {
            const home = f.homeTeam;
            const away = f.awayTeam;
            const pick = pickLabelFor(model, home.name, away.name, tHome("draw"));
            const narrative = buildMatchNarrative({
              homeName: home.name,
              awayName: away.name,
              homeForm: home.form as FormResult[],
              awayForm: away.form as FormResult[],
              homePos: home.leaguePos,
              awayPos: away.leaguePos,
              model,
            });
            return (
              <Link key={f.id} href={`/match/${f.id}`} className="card-interactive block p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber">
                    <Clock size={11} />
                    <span>
                      {t("kickoffLabel")}: {new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(f.kickoff)}
                    </span>
                  </div>
                  <div className="text-sm font-mono font-bold text-lime shrink-0 ml-2">
                    {pick.label} {pick.pct}%
                  </div>
                </div>
                <div className="font-display text-lg text-ink mb-2">
                  {home.name} – {away.name}
                </div>
                <p className="text-xs text-muted leading-relaxed">{narrative.teaser}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { Gauge, Scale } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getOverallAccuracy } from "@/lib/accuracy";
import { Eyebrow } from "@/components/predictor/ui";
import { buildCalibration } from "@/lib/calibration";

// Public, non-personalized — updates via settle-results (every 2h), so a
// short revalidate window is imperceptibly stale but avoids a full
// server round-trip on every navigation.
export const revalidate = 60;

export default async function HistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tMarkets, tu] = await Promise.all([
    getTranslations("history"),
    getTranslations("markets"),
    getTranslations("upgrade"),
  ]);
  const MARKET_LABELS: Record<string, string> = {
    ONE_X_TWO: tMarkets("oneXTwo"),
    DOUBLE_CHANCE: tMarkets("doubleChance"),
    ASIAN_HANDICAP: tMarkets("asianHandicap"),
    HT_FT: tMarkets("htFt"),
    OVER_UNDER_2_5: tMarkets("overUnder"),
    BTTS: tMarkets("btts"),
    CORRECT_SCORE: tMarkets("correctScore"),
  };

  const [results, { total, correct, accuracy }] = await Promise.all([
    prisma.predictionResult.findMany({
      include: { prediction: { include: { fixture: { include: { homeTeam: true, awayTeam: true } } } } },
      orderBy: { settledAt: "desc" },
      take: 100,
    }),
    getOverallAccuracy(),
  ]);

  const byMarket = new Map<string, { total: number; hits: number }>();
  for (const r of results) {
    const entry = byMarket.get(r.market) ?? { total: 0, hits: 0 };
    entry.total++;
    if (r.hit) entry.hits++;
    byMarket.set(r.market, entry);
  }
  const calibration = buildCalibration(results.map((result) => ({ predictedPct: result.predictedPct, hit: result.hit })));

  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-16">
      <div className="flex items-center gap-2 mb-2 animate-fade-up">
        <Gauge size={16} className="text-lime" />
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-dim">{t("kicker")}</span>
      </div>
      <h1 className="font-display text-4xl mb-6 font-extrabold text-ink tracking-tight animate-fade-up" style={{ animationDelay: "60ms" }}>
        {t("title")}
      </h1>

      <div className="card p-6 mb-8 flex items-center gap-5 animate-fade-up" style={{ animationDelay: "120ms" }}>
        <div className="font-display text-5xl font-mono text-gradient">{accuracy}%</div>
        <div className="text-xs text-muted leading-relaxed">{t("summary", { total, correct })}</div>
      </div>

      {byMarket.size > 0 && (
        <>
          <Eyebrow>{t("byMarket")}</Eyebrow>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
            {Array.from(byMarket.entries()).map(([market, { total, hits }]) => (
              <div key={market} className="card p-3.5">
                <div className="text-[9px] uppercase tracking-wide font-mono mb-1.5 text-dim">
                  {MARKET_LABELS[market] ?? market}
                </div>
                <div className="text-lg font-bold font-mono text-lime">{Math.round((hits / total) * 100)}%</div>
                <div className="text-[10px] mt-1 text-muted">
                  {hits}/{total}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {calibration.length > 0 && (
        <section className="mb-8" aria-labelledby="calibration-title">
          <div className="mb-3 flex items-center gap-2">
            <Scale size={14} className="text-lime" />
            <h2 id="calibration-title" className="text-xs font-bold uppercase tracking-[0.16em] text-ink">{tu("calibrationTitle")}</h2>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-muted">{tu("calibrationBody")}</p>
          <div className="card overflow-x-auto p-4">
            <div className="min-w-[520px] space-y-4">
              {calibration.map((bucket) => (
                <div key={bucket.label} className="grid grid-cols-[64px_1fr_48px] items-center gap-3">
                  <div className="text-[10px] font-mono text-muted">{bucket.label}</div>
                  <div>
                    <div className="relative h-7 overflow-hidden rounded-lg bg-surface2">
                      <div className="absolute inset-y-0 left-0 bg-lime/20" style={{ width: `${bucket.expected}%` }} />
                      <div className="absolute bottom-0 left-0 h-1.5 bg-lime" style={{ width: `${bucket.actual}%` }} />
                      <div className="relative flex h-full items-center justify-between px-2 text-[9px] font-mono">
                        <span className="text-muted">{tu("expected", { value: bucket.expected })}</span>
                        <span className="font-bold text-ink">{tu("actual", { value: bucket.actual })}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`text-right text-[10px] font-bold font-mono ${Math.abs(bucket.gap) <= 8 ? "text-green" : "text-amber"}`}>{bucket.gap > 0 ? "+" : ""}{bucket.gap}%</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Eyebrow>{t("recentTitle")}</Eyebrow>
      {results.length === 0 && (
        <div className="card p-6 text-center">
          <div className="text-xs text-dim">{t("empty")}</div>
        </div>
      )}
      <div className="space-y-2">
        {results.map((r) => (
          <div key={r.id} className="card-interactive flex items-center justify-between py-3 px-4">
            <div>
              <div className="text-xs font-medium text-ink">
                {r.prediction.fixture.homeTeam.name} – {r.prediction.fixture.awayTeam.name}
              </div>
              <div className="text-[10px] font-mono mt-0.5 text-dim">
                {t("rowDetail", {
                  market: MARKET_LABELS[r.market] ?? r.market,
                  predicted: r.predicted,
                  pct: r.predictedPct,
                  actual: r.actual,
                })}
              </div>
            </div>
            <span
              className={`text-[10px] px-2.5 py-1 rounded-full font-bold font-mono shrink-0 ml-2 ${
                r.hit ? "bg-green/15 text-green" : "bg-rose/15 text-rose"
              }`}
            >
              {r.hit ? t("hit") : t("miss")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

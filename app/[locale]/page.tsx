import { getTranslations, setRequestLocale } from "next-intl/server";
import { Activity, ArrowRight, BarChart3, Database, ShieldCheck, Sigma } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { presentPrediction, hoursUntil } from "@/lib/present";
import { PickOfDay } from "@/components/predictor/PickOfDay";
import { InstinctQuiz } from "@/components/predictor/InstinctQuiz";
import { TopPicks, type TopPickItem } from "@/components/predictor/TopPicks";
import { NewsFeed } from "@/components/predictor/NewsFeed";
import { getLatestSportsNews } from "@/lib/news";
import { Ticker } from "@/components/predictor/Ticker";
import { LiveTicker } from "@/components/predictor/LiveTicker";
import { OnThisDay } from "@/components/predictor/OnThisDay";
import { getTodaysFootballHistory, getFallbackFootballFact } from "@/lib/football-history";
import { Mascot } from "@/components/predictor/Mascot";
import { getOverallAccuracy } from "@/lib/accuracy";
import { AdSlotBoxes } from "@/components/AdSlotBoxes";
import { FixtureExplorer, type FixtureExplorerItem, type TeamSearchItem } from "@/components/predictor/FixtureExplorer";
import { TeamFinder } from "@/components/predictor/TeamFinder";

const AD_SLOT_KEY = "homepage-sidebar";

function pickLabelFor(
  model: { winHome: number; draw: number; winAway: number },
  homeName: string,
  awayName: string,
  drawLabel: string
) {
  if (model.winHome >= model.draw && model.winHome >= model.winAway) return { label: homeName, pct: model.winHome };
  if (model.winAway >= model.draw && model.winAway >= model.winHome) return { label: awayName, pct: model.winAway };
  return { label: drawLabel, pct: model.draw };
}

// Public, non-personalized — predictions/news/accuracy only change via
// crons (hourly at the fastest), so a short revalidate avoids a full DB
// round-trip on every single navigation to the homepage, the single most
// common page transition on the site.
export const revalidate = 60;

export default async function TodayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const dateLocale = ["el", "en", "bg", "ru"].includes(locale) ? locale : "el";
  const [t, tu] = await Promise.all([getTranslations("home"), getTranslations("upgrade")]);
  const [fixtures, teams, news, overallAccuracy, adBanners] = await Promise.all([
    prisma.fixture.findMany({
      where: { kickoff: { gte: new Date() }, prediction: { isNot: null } },
      include: { homeTeam: true, awayTeam: true, league: true, prediction: true },
      orderBy: { kickoff: "asc" },
      take: 20,
    }),
    prisma.team.findMany({
      include: { league: { select: { name: true, country: true } } },
      orderBy: { name: "asc" },
    }),
    getLatestSportsNews(),
    getOverallAccuracy(),
    prisma.adBanner.findMany({ where: { slotKey: AD_SLOT_KEY } }),
  ]);

  const withModel = fixtures
    .filter((f) => f.prediction)
    .map((f) => ({ fixture: f, model: presentPrediction(f.prediction!) }));

  const byConfidence = [...withModel].sort((a, b) => b.model.confidence - a.model.confidence);
  const pickOfDay = byConfidence[0];
  const topPicks: TopPickItem[] = byConfidence
    .slice(1, 4)
    .map(({ fixture: f, model }) => {
      const p = pickLabelFor(model, f.homeTeam.name, f.awayTeam.name, t("draw"));
      return { fixtureId: f.id, homeName: f.homeTeam.name, awayName: f.awayTeam.name, pickLabel: p.label, pct: p.pct };
    });
  const tickerItems = byConfidence.slice(0, 12).map(({ fixture: f, model }) => {
    const p = pickLabelFor(model, f.homeTeam.name, f.awayTeam.name, t("draw"));
    return { fixtureId: f.id, homeName: f.homeTeam.name, awayName: f.awayTeam.name, pickLabel: p.label, pct: p.pct };
  });
  const historyFact = getTodaysFootballHistory();
  const fallbackFact = getFallbackFootballFact();
  const explorerItems: FixtureExplorerItem[] = withModel.map(({ fixture: f, model }) => ({
    id: f.id,
    homeName: f.homeTeam.name,
    awayName: f.awayTeam.name,
    homeLogoUrl: f.homeTeam.logoUrl,
    awayLogoUrl: f.awayTeam.logoUrl,
    homeLeaguePos: f.homeTeam.leaguePos,
    awayLeaguePos: f.awayTeam.leaguePos,
    leagueName: f.league.name,
    venue: f.venue,
    hoursUntil: hoursUntil(f.kickoff),
    confidence: model.confidence,
    winHome: model.winHome,
    draw: model.draw,
    winAway: model.winAway,
    score: `${model.scores[0].h}-${model.scores[0].a}`,
    over25: model.ouLines[1].over,
    bttsYes: model.bttsYes,
    frozenAt: f.prediction!.frozenAt.toISOString(),
  }));
  const teamSearchItems: TeamSearchItem[] = teams.map((team) => ({
    id: team.id,
    name: team.name,
    shortName: team.shortName,
    logoUrl: team.logoUrl,
    leagueName: team.league.name,
    country: team.league.country,
  }));
  const latestDataAt = withModel.reduce<Date | null>((latest, { fixture }) => {
    const candidates = [fixture.prediction?.frozenAt, fixture.homeTeam.statsUpdatedAt, fixture.awayTeam.statsUpdatedAt].filter(
      (value): value is Date => Boolean(value)
    );
    const newest = candidates.sort((a, b) => b.getTime() - a.getTime())[0];
    return !newest || (latest && latest > newest) ? latest : newest;
  }, null);

  return (
    <div className="relative">
      <Ticker items={tickerItems} />
      <LiveTicker />
      <section className="relative overflow-hidden border-b border-white/[0.07] py-8 sm:py-14">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,200,0,0.11),transparent_42%),radial-gradient(circle_at_78%_25%,rgba(255,200,0,0.12),transparent_32%)]" />
        <div className="absolute -right-20 -top-32 h-96 w-96 rotate-12 border-[80px] border-lime/[0.07]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green/25 bg-green/10 px-3 py-1.5 animate-fade-up">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-green">{tu("online")}</span>
            </div>
            <div className="mb-3 flex items-center gap-2 animate-fade-up">
              <Sigma size={14} className="text-lime" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{t("kicker")}</span>
            </div>
            <h1 className="max-w-2xl break-words font-display text-[clamp(2.25rem,11vw,3.75rem)] font-extrabold uppercase leading-[0.96] tracking-[-0.045em] text-ink animate-fade-up">
              {t("titleLine1")}<br /><span className="text-lime">{t("titleHighlight")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted animate-fade-up sm:text-base">{t("subtitle")}</p>
            <TeamFinder teams={teamSearchItems} />
            <div className="mt-6 flex flex-wrap gap-3 animate-fade-up">
              <a href="#analyses" className="btn-primary !rounded-full !px-5">{tu("seeAnalyses")} <ArrowRight size={13} /></a>
              <Link href="/history" className="btn-secondary !rounded-full !px-5"><ShieldCheck size={13} /> {tu("accuracyHistory")}</Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-lime/25 bg-[#111113]/90 p-4 shadow-[0_30px_90px_-40px_rgba(255,200,0,0.45)] backdrop-blur sm:min-h-[290px] sm:p-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-dim">{tu("dataRoom")}</div>
                <div className="mt-1 font-display text-lg font-extrabold text-ink">{tu("transparency")}</div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-lime text-bg"><Database size={18} /></div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
              <div className="trust-stat"><Activity size={15} className="text-green" /><strong>{fixtures.length}</strong><span>{tu("todayCount")}</span></div>
              <div className="trust-stat"><ShieldCheck size={15} className="text-lime" /><strong>{overallAccuracy.total >= 10 ? `${overallAccuracy.accuracy}%` : "Live"}</strong><span>{tu("verifiedPerformance")}</span></div>
              <div className="trust-stat"><BarChart3 size={15} className="text-blue" /><strong>{overallAccuracy.total}+</strong><span>{tu("settledMarkets")}</span></div>
              <div className="trust-stat"><Sigma size={15} className="text-amber" /><strong>Dixon–Coles</strong><span>{tu("publishedModel")}</span></div>
            </div>

            <div className="mt-3 grid gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 sm:grid-cols-[minmax(210px,auto)_1fr] sm:items-center">
              <Mascot />
              <div className="min-w-0 border-t border-white/[0.07] pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                <p className="text-[10px] leading-relaxed text-muted">{tu("lockedExplanation")}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono text-dim">
                  <span>{tu("source")}</span>
                  {latestDataAt ? <time dateTime={latestDataAt.toISOString()}>{tu("lastUpdated", { date: latestDataAt.toLocaleString(dateLocale, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) })}</time> : null}
                  <Link href="/guide" className="font-bold text-lime hover:underline">{tu("methodology")}</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative max-w-6xl mx-auto px-5 pt-8 pb-8 lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:items-start">
        <div>
          {fixtures.length === 0 && (
            <div className="card p-6 text-center animate-fade-up">
              <div className="text-sm text-ink font-medium mb-1">{t("emptyTitle")}</div>
              <div className="text-xs text-dim">{t("emptySubtitle")}</div>
            </div>
          )}

          {/* Sidebar content repeated inline on mobile, above the list */}
          <div className="mb-4 space-y-4 lg:hidden">
            {pickOfDay && (
              <>
                <PickOfDay
                  fixtureId={pickOfDay.fixture.id}
                  homeName={pickOfDay.fixture.homeTeam.name}
                  awayName={pickOfDay.fixture.awayTeam.name}
                  homeLogoUrl={pickOfDay.fixture.homeTeam.logoUrl}
                  awayLogoUrl={pickOfDay.fixture.awayTeam.logoUrl}
                  leagueName={pickOfDay.fixture.league.name}
                  kickoff={pickOfDay.fixture.kickoff}
                  model={pickOfDay.model}
                />
                <TopPicks items={topPicks} />
              </>
            )}
            <NewsFeed items={news} />
            <OnThisDay fact={historyFact} fallbackFact={fallbackFact} />
          </div>

          <div id="analyses" className="scroll-mt-24">
            <FixtureExplorer items={explorerItems} teams={teamSearchItems} />
          </div>

          <div className="mt-8 card p-5 text-[11px] leading-relaxed text-dim">
            <b className="text-lime">{t("engineTitle")}</b> {t("engineBody")}
          </div>
        </div>

        <div className="hidden lg:block space-y-4">
          {pickOfDay && (
            <PickOfDay
              fixtureId={pickOfDay.fixture.id}
              homeName={pickOfDay.fixture.homeTeam.name}
              awayName={pickOfDay.fixture.awayTeam.name}
              model={pickOfDay.model}
            />
          )}
          <TopPicks items={topPicks} />
          <NewsFeed items={news} />
          <OnThisDay fact={historyFact} fallbackFact={fallbackFact} />
          {pickOfDay && (
            <InstinctQuiz
              homeName={pickOfDay.fixture.homeTeam.name}
              awayName={pickOfDay.fixture.awayTeam.name}
              winHome={pickOfDay.model.winHome}
              draw={pickOfDay.model.draw}
              winAway={pickOfDay.model.winAway}
            />
          )}
          <AdSlotBoxes slotKey={AD_SLOT_KEY} initialBanners={adBanners} />
        </div>

        {pickOfDay && (
          <div className="mt-4 lg:hidden">
            <InstinctQuiz
              homeName={pickOfDay.fixture.homeTeam.name}
              awayName={pickOfDay.fixture.awayTeam.name}
              winHome={pickOfDay.model.winHome}
              draw={pickOfDay.model.draw}
              winAway={pickOfDay.model.winAway}
            />
          </div>
        )}
        <div className="mt-4 lg:hidden">
          <AdSlotBoxes slotKey={AD_SLOT_KEY} initialBanners={adBanners} />
        </div>
      </div>
    </div>
  );
}

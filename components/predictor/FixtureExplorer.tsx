"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Clock3,
  Filter,
  GitCompareArrows,
  LayoutGrid,
  List,
  Search,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

export interface FixtureExplorerItem {
  id: number;
  homeName: string;
  awayName: string;
  homeLogoUrl: string | null;
  awayLogoUrl: string | null;
  homeLeaguePos: number | null;
  awayLeaguePos: number | null;
  leagueName: string;
  venue: string | null;
  hoursUntil: number;
  confidence: number;
  winHome: number;
  draw: number;
  winAway: number;
  score: string;
  over25: number;
  bttsYes: number;
  frozenAt: string;
}

export interface TeamSearchItem {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string | null;
  leagueName: string;
  country: string;
}

type FilterKey = "all" | "forYou" | "confidence" | "soon" | "saved";
type ViewMode = "detailed" | "compact";

const STORAGE_KEY = "skorama-explorer-v1";
const PERSONALIZATION_KEY = "skorama-personalization-v1";

function TeamCrest({ src, name, compact = false }: { src: string | null; name: string; compact?: boolean }) {
  const size = compact ? "h-9 w-9 rounded-xl" : "h-12 w-12 rounded-2xl";
  if (!src) {
    return <div className={`mx-auto grid ${size} place-items-center border border-white/10 bg-white/[0.04] text-xs font-black text-dim`}>{name.slice(0, 2).toUpperCase()}</div>;
  }
  // API-Football provides dynamic crest URLs outside our static image host list.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={`${name} logo`} className={`mx-auto ${compact ? "h-9 w-9" : "h-12 w-12"} object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)]`} />;
}

export function FixtureExplorer({ items, teams = [] }: { items: FixtureExplorerItem[]; teams?: TeamSearchItem[] }) {
  const t = useTranslations("upgrade");
  const locale = useLocale();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [league, setLeague] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("detailed");
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [favoriteLeagues, setFavoriteLeagues] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase("el"));

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as { savedIds?: number[]; viewMode?: ViewMode; league?: string };
        setSavedIds(stored.savedIds ?? []);
        setViewMode(stored.viewMode === "compact" ? "compact" : "detailed");
        setLeague(stored.league ?? "all");
      }
      const personalRaw = window.localStorage.getItem(PERSONALIZATION_KEY);
      if (personalRaw) setFavoriteLeagues((JSON.parse(personalRaw) as { favoriteLeagues?: string[] }).favoriteLeagues ?? []);
    } catch {
      // A corrupt preference should never block the match board.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedIds, viewMode, league }));
  }, [hydrated, league, savedIds, viewMode]);

  const leagues = useMemo(() => Array.from(new Set(items.map((item) => item.leagueName))).sort(), [items]);
  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);
  const compareSet = useMemo(() => new Set(compareIds), [compareIds]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeFilter === "confidence" && item.confidence < 60) return false;
      if (activeFilter === "soon" && item.hoursUntil > 12) return false;
      if (activeFilter === "saved" && !savedSet.has(item.id)) return false;
      if (activeFilter === "forYou" && !favoriteLeagues.includes(item.leagueName) && !savedSet.has(item.id)) return false;
      if (league !== "all" && item.leagueName !== league) return false;
      if (deferredQuery && !`${item.homeName} ${item.awayName} ${item.leagueName}`.toLocaleLowerCase("el").includes(deferredQuery)) return false;
      return true;
    });
  }, [activeFilter, deferredQuery, favoriteLeagues, items, league, savedSet]);

  const comparedItems = compareIds.map((id) => items.find((item) => item.id === id)).filter((item): item is FixtureExplorerItem => Boolean(item));
  const teamResults = useMemo(() => {
    if (deferredQuery.length < 2) return [];
    return teams
      .filter((team) => `${team.name} ${team.shortName} ${team.leagueName} ${team.country}`.toLocaleLowerCase(locale).includes(deferredQuery))
      .slice(0, 6);
  }, [deferredQuery, locale, teams]);
  const filters: { key: FilterKey; label: string; icon: typeof Filter }[] = [
    { key: "all", label: t("all"), icon: BarChart3 },
    { key: "forYou", label: t("forYou"), icon: Star },
    { key: "confidence", label: t("highConfidence"), icon: ShieldCheck },
    { key: "soon", label: t("soon"), icon: Clock3 },
    { key: "saved", label: `${t("watchlist")}${savedIds.length ? ` (${savedIds.length})` : ""}`, icon: Star },
  ];

  function toggleSaved(id: number) {
    setSavedIds((current) => current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id]);
  }

  function toggleCompare(id: number) {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((compareId) => compareId !== id);
      return current.length >= 2 ? [current[1], id] : [...current, id];
    });
  }

  function resetFilters() {
    setActiveFilter("all");
    setQuery("");
    setLeague("all");
  }

  return (
    <section aria-labelledby="fixture-explorer-title">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-lime"><span className="h-px w-6 bg-lime" /> {t("liveBoard")}</div>
          <h2 id="fixture-explorer-title" className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{t("todayAnalyses")}</h2>
          <p className="mt-1 text-xs text-muted">{t("explorerSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-xl border border-white/[0.07] bg-white/[0.025] p-1" role="group" aria-label="Πυκνότητα προβολής">
          <button type="button" onClick={() => setViewMode("detailed")} aria-pressed={viewMode === "detailed"} className={`grid min-h-10 min-w-10 place-items-center rounded-lg ${viewMode === "detailed" ? "bg-lime text-bg" : "text-muted hover:text-ink"}`} aria-label={t("detailedView")}><LayoutGrid size={15} /></button>
          <button type="button" onClick={() => setViewMode("compact")} aria-pressed={viewMode === "compact"} className={`grid min-h-10 min-w-10 place-items-center rounded-lg ${viewMode === "compact" ? "bg-lime text-bg" : "text-muted hover:text-ink"}`} aria-label={t("compactView")}><List size={16} /></button>
        </div>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_220px]">
        <label className="relative block">
          <span className="sr-only">{t("searchLabel")}</span>
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchPlaceholder")} className="input min-h-11 !pl-10" />
          {query ? <button type="button" onClick={() => setQuery("")} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-dim hover:bg-white/5 hover:text-ink" aria-label={t("clearSearch")}><X size={14} /></button> : null}
          {teamResults.length ? (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-2xl border border-white/15 bg-[#111113]/[0.98] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.65)] backdrop-blur-xl" role="listbox" aria-label={t("teamResults")}>
              <div className="px-3 pb-2 pt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-dim">{t("teamResults")}</div>
              {teamResults.map((team) => (
                <Link key={team.id} href={`/team/${team.id}`} className="flex min-h-14 items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-white/[0.06]" role="option">
                  <TeamCrest src={team.logoUrl} name={team.name} compact />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-ink">{team.name}</span><span className="block truncate text-[10px] text-muted">{team.leagueName} · {team.country}</span></span>
                  <ArrowRight size={14} className="shrink-0 text-lime" />
                </Link>
              ))}
            </div>
          ) : null}
        </label>
        <label>
          <span className="sr-only">Πρωτάθλημα</span>
          <select value={league} onChange={(event) => setLeague(event.target.value)} className="input min-h-11">
            <option value="all">{t("allLeagues")}</option>
            {leagues.map((leagueName) => <option key={leagueName} value={leagueName}>{leagueName}</option>)}
          </select>
        </label>
      </div>

      <div className="mb-5 flex max-w-full gap-2 overflow-x-auto pb-1 scrollbar-none" role="group" aria-label="Φίλτρα αγώνων">
        {filters.map(({ key, label, icon: Icon }) => {
          const active = activeFilter === key;
          return <button key={key} type="button" onClick={() => setActiveFilter(key)} aria-pressed={active} className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide transition-all ${active ? "border-lime bg-lime text-bg shadow-glow" : "border-white/10 bg-white/[0.035] text-muted hover:border-lime/40 hover:text-ink"}`}><Icon size={12} /> {label}</button>;
        })}
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-8 text-center">
          <Filter className="mx-auto mb-3 text-dim" size={22} />
          <p className="text-sm font-semibold text-ink">{t("noMatches")}</p>
          <button type="button" onClick={resetFilters} className="mt-3 min-h-11 rounded-full px-4 text-xs font-bold text-lime hover:bg-lime/10">{t("clearFilters")}</button>
        </div>
      ) : (
        <div className={viewMode === "compact" ? "space-y-2" : "grid gap-4 md:grid-cols-2"}>
          {filteredItems.map((item) => {
            const strongest = Math.max(item.winHome, item.draw, item.winAway);
            const saved = savedSet.has(item.id);
            const comparing = compareSet.has(item.id);
            const resultOptions = [{ key: "1", value: item.winHome }, { key: "X", value: item.draw }, { key: "2", value: item.winAway }];

            if (viewMode === "compact") {
              return (
                <article key={item.id} className="match-card flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#141416]/95 p-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <TeamCrest src={item.homeLogoUrl} name={item.homeName} compact />
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold text-ink">{item.homeName} – {item.awayName}</div><div className="mt-1 truncate text-[10px] text-dim">{item.leagueName} · {t("inHours", { hours: item.hoursUntil })}</div></div>
                    <TeamCrest src={item.awayLogoUrl} name={item.awayName} compact />
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="flex gap-1 font-mono text-[10px]">{resultOptions.map((option) => <span key={option.key} className={`rounded-lg border px-2 py-1.5 ${option.value === strongest ? "border-lime/50 bg-lime/10 text-lime" : "border-white/[0.07] text-muted"}`}>{option.key} {option.value}%</span>)}</div>
                    <ActionButtons item={item} saved={saved} comparing={comparing} onSave={toggleSaved} onCompare={toggleCompare} compact />
                  </div>
                </article>
              );
            }

            return (
              <article key={item.id} className="match-card group rounded-2xl border border-white/10 bg-[#141416]/95 p-5">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="min-w-0"><div className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{item.leagueName}</div><div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] font-mono text-dim"><Clock3 size={11} className="text-lime" /> {t("inHours", { hours: item.hoursUntil })}{item.venue ? ` · ${item.venue}` : ""}</div></div>
                  <ActionButtons item={item} saved={saved} comparing={comparing} onSave={toggleSaved} onCompare={toggleCompare} />
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="min-w-0 text-center"><TeamCrest src={item.homeLogoUrl} name={item.homeName} /><div className="mt-2 truncate text-sm font-extrabold text-ink">{item.homeName}</div>{item.homeLeaguePos ? <div className="mt-0.5 text-[10px] font-mono text-dim">{t("position", { position: item.homeLeaguePos })}</div> : null}</div>
                  <div className="flex flex-col items-center gap-1"><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-dim">{t("versus")}</span><span className="grid h-8 w-8 place-items-center rounded-full border border-lime/30 bg-lime/10 font-display text-[10px] font-black text-lime">VS</span></div>
                  <div className="min-w-0 text-center"><TeamCrest src={item.awayLogoUrl} name={item.awayName} /><div className="mt-2 truncate text-sm font-extrabold text-ink">{item.awayName}</div>{item.awayLeaguePos ? <div className="mt-0.5 text-[10px] font-mono text-dim">{t("position", { position: item.awayLeaguePos })}</div> : null}</div>
                </div>
                <div className="my-5 grid grid-cols-3 gap-2">{resultOptions.map((option) => <div key={option.key} className={`rounded-xl border px-2 py-2.5 text-center ${option.value === strongest ? "border-lime/60 bg-lime/10" : "border-white/[0.07] bg-white/[0.025]"}`}><div className="text-[10px] font-bold text-dim">{option.key}</div><div className={`font-mono text-base font-bold ${option.value === strongest ? "text-lime" : "text-ink"}`}>{option.value}%</div></div>)}</div>
                <div className="flex items-center justify-between border-t border-white/[0.07] pt-4"><div className="flex gap-3 text-[10px] font-mono text-muted sm:gap-4"><span>{t("score")} <b className="text-ink">{item.score}</b></span><span>O2.5 <b className="text-ink">{item.over25}%</b></span><span>GG <b className="text-ink">{item.bttsYes}%</b></span></div><Link href={`/match/${item.id}`} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-[10px] font-bold uppercase tracking-wide text-lime hover:bg-lime/10">{t("analysis")} <ArrowRight size={12} /></Link></div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-1 text-[10px] text-dim"><span>{t("source")}</span><time dateTime={item.frozenAt}>{t("lockedAt", { date: new Date(item.frozenAt).toLocaleString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) })}</time></div>
              </article>
            );
          })}
        </div>
      )}

      {comparedItems.length ? (
        <aside className="sticky bottom-4 z-30 mx-auto mt-5 max-w-2xl rounded-2xl border border-lime/30 bg-[#111113]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl" aria-label={t("compare", { count: comparedItems.length })}>
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs font-bold text-ink"><GitCompareArrows size={15} className="text-lime" /> {t("compare", { count: comparedItems.length })}</div><button type="button" onClick={() => setCompareIds([])} className="grid h-9 w-9 place-items-center rounded-lg text-dim hover:bg-white/5 hover:text-ink" aria-label={t("clearComparison")}><X size={14} /></button></div>
          <div className="mt-3 grid grid-cols-2 gap-2">{comparedItems.map((item) => <Link key={item.id} href={`/match/${item.id}`} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 hover:border-lime/30"><div className="truncate text-[11px] font-bold text-ink">{item.homeName} – {item.awayName}</div><div className="mt-1 text-[10px] text-muted">{t("confidence")} <b className="text-lime">{item.confidence}%</b> · O2.5 {item.over25}%</div></Link>)}</div>
          {comparedItems.length === 1 ? <p className="mt-2 text-[10px] text-dim">{t("selectAnother")}</p> : null}
        </aside>
      ) : null}
    </section>
  );
}

function ActionButtons({ item, saved, comparing, onSave, onCompare, compact = false }: { item: FixtureExplorerItem; saved: boolean; comparing: boolean; onSave: (id: number) => void; onCompare: (id: number) => void; compact?: boolean }) {
  const t = useTranslations("upgrade");
  return (
    <div className={`flex shrink-0 items-center ${compact ? "gap-1" : "gap-1.5"}`}>
      <button type="button" onClick={() => onSave(item.id)} aria-pressed={saved} className={`grid min-h-10 min-w-10 place-items-center rounded-xl border transition-colors ${saved ? "border-lime/50 bg-lime/10 text-lime" : "border-white/[0.08] text-dim hover:border-lime/30 hover:text-lime"}`} aria-label={saved ? t("removeWatchlist") : t("addWatchlist")}><Star size={14} fill={saved ? "currentColor" : "none"} /></button>
      <button type="button" onClick={() => onCompare(item.id)} aria-pressed={comparing} className={`grid min-h-10 min-w-10 place-items-center rounded-xl border transition-colors ${comparing ? "border-blue/50 bg-blue/10 text-blue" : "border-white/[0.08] text-dim hover:border-blue/30 hover:text-blue"}`} aria-label={comparing ? t("removeCompare") : t("addCompare")}><GitCompareArrows size={14} /></button>
    </div>
  );
}

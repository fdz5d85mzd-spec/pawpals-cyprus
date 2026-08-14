"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { TeamSearchItem } from "./FixtureExplorer";

export function TeamFinder({ teams }: { teams: TeamSearchItem[] }) {
  const t = useTranslations("upgrade");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase(locale));
  const results = useMemo(() => {
    if (deferredQuery.length < 2) return [];
    return teams
      .filter((team) => `${team.name} ${team.shortName} ${team.leagueName} ${team.country}`.toLocaleLowerCase(locale).includes(deferredQuery))
      .slice(0, 7);
  }, [deferredQuery, locale, teams]);

  return (
    <div className="relative z-30 mt-6 max-w-xl animate-fade-up">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink">
        <Search size={13} className="text-lime" /> {t("findTeam")}
      </div>
      <label className="relative block">
        <span className="sr-only">{t("searchLabel")}</span>
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lime" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("teamSearchPlaceholder")}
          className="min-h-14 w-full rounded-2xl border border-lime/35 bg-[#111113]/95 py-3 pl-12 pr-12 text-sm font-semibold text-ink shadow-[0_18px_55px_rgba(0,0,0,0.35)] outline-none transition placeholder:text-dim focus:border-lime focus:ring-4 focus:ring-lime/10"
        />
        {query ? <button type="button" onClick={() => setQuery("")} className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl text-dim hover:bg-white/5 hover:text-ink" aria-label={t("clearSearch")}><X size={15} /></button> : null}
      </label>
      {results.length ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-2xl border border-white/15 bg-[#111113]/[0.98] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.7)] backdrop-blur-xl" role="listbox" aria-label={t("teamResults")}>
          {results.map((team) => (
            <Link key={team.id} href={`/team/${team.id}`} role="option" className="flex min-h-14 items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-white/[0.06]">
              {/* Team crest hosts are supplied dynamically by API-Football. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {team.logoUrl ? <img src={team.logoUrl} alt="" className="h-9 w-9 object-contain" /> : <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-[10px] font-black text-muted">{team.shortName.slice(0, 2)}</span>}
              <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-ink">{team.name}</strong><span className="block truncate text-[10px] text-muted">{team.leagueName} · {team.country}</span></span>
              <ArrowRight size={14} className="shrink-0 text-lime" />
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Mail, Settings2, Star } from "lucide-react";
import { useTranslations } from "next-intl";

const PREFERENCES_KEY = "skorama-personalization-v1";

export function PersonalizationPreferences({ leagues, initialEmailOptIn }: { leagues: string[]; initialEmailOptIn: boolean }) {
  const t = useTranslations("upgrade");
  const [favoriteLeagues, setFavoriteLeagues] = useState<string[]>([]);
  const [emailOptIn, setEmailOptIn] = useState(initialEmailOptIn);
  const [savingEmail, setSavingEmail] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFERENCES_KEY);
      if (raw) setFavoriteLeagues((JSON.parse(raw) as { favoriteLeagues?: string[] }).favoriteLeagues ?? []);
    } catch {
      // Ignore invalid local preferences and let the user choose again.
    }
  }, []);

  function toggleLeague(league: string) {
    setFavoriteLeagues((current) => {
      const next = current.includes(league) ? current.filter((item) => item !== league) : [...current, league];
      window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ favoriteLeagues: next }));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1400);
      return next;
    });
  }

  async function toggleEmail() {
    const next = !emailOptIn;
    setSavingEmail(true);
    try {
      const response = await fetch("/api/account/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailUpdatesOptIn: next }),
      });
      if (response.ok) setEmailOptIn(next);
    } finally {
      setSavingEmail(false);
    }
  }

  return (
    <section className="card p-5" aria-labelledby="preferences-title">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><Settings2 size={15} className="text-lime" /><h2 id="preferences-title" className="text-sm font-bold text-ink">{t("personalTitle")}</h2></div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">{t("personalBody")}</p>
        </div>
        {saved ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green"><Check size={12} /> {t("saved")}</span> : null}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {leagues.map((league) => {
          const active = favoriteLeagues.includes(league);
          return <button key={league} type="button" onClick={() => toggleLeague(league)} aria-pressed={active} className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-[10px] font-bold transition-colors ${active ? "border-lime/50 bg-lime/10 text-lime" : "border-white/10 text-muted hover:border-lime/25 hover:text-ink"}`}><Star size={11} fill={active ? "currentColor" : "none"} />{league}</button>;
        })}
      </div>

      <div className="space-y-2">
        <button type="button" onClick={toggleEmail} disabled={savingEmail} className="flex min-h-12 w-full items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 text-left transition-colors hover:border-lime/25 disabled:opacity-60">
          <span className="flex items-center gap-3"><Mail size={15} className="text-lime" /><span><span className="block text-xs font-bold text-ink">{t("weeklyRecap")}</span><span className="mt-0.5 block text-[10px] text-muted">{t("weeklyRecapBody")}</span></span></span>
          <span className={`relative h-6 w-11 rounded-full transition-colors ${emailOptIn ? "bg-lime" : "bg-surface3"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-bg transition-transform ${emailOptIn ? "translate-x-6" : "translate-x-1"}`} /></span>
        </button>
        <div className="flex min-h-12 items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5"><Bell size={15} className="text-green" /><div><div className="text-xs font-bold text-ink">{t("matchNotifications")}</div><div className="mt-0.5 text-[10px] text-muted">{t("matchNotificationsBody")}</div></div></div>
      </div>
    </section>
  );
}

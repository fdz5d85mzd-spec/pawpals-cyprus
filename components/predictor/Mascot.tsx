"use client";

import { BarChart3, BellRing, CircleHelp } from "lucide-react";
import { useTranslations } from "next-intl";

/** A contained assistant identity that never paints outside its own box. */
export function Mascot({ className = "" }: { className?: string }) {
  const t = useTranslations("upgrade");
  return (
    <div className={`mascot-assistant flex min-w-0 items-center gap-3 ${className}`} role="note" aria-label={t("assistantLabel")}>
      <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-lime/30 bg-lime/10 shadow-[0_10px_28px_rgba(255,200,0,0.12)]">
        <div className="mascot-assistant__pulse absolute inset-2 rounded-full border border-lime/25" />
        <svg viewBox="0 0 48 48" className="mascot-assistant__face relative h-10 w-10" aria-hidden="true">
          <path d="M12 20c0-8 5-13 12-13s12 5 12 13v7c0 8-5 14-12 14S12 35 12 27z" fill="#ffc800" />
          <path d="M14 18c2-8 18-9 21 0-3-2-6-3-10-3-5 0-8 1-11 3Z" fill="#101014" />
          <circle cx="19" cy="25" r="2" fill="#101014" /><circle cx="29" cy="25" r="2" fill="#101014" />
          <path d="M19 32c3 2 7 2 10 0" fill="none" stroke="#101014" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 26c0-3 2-5 4-5v10c-2 0-4-2-4-5Zm30 0c0-3-2-5-4-5v10c2 0 4-2 4-5Z" fill="#ffc800" stroke="#101014" strokeWidth="1.5" />
        </svg>
        <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-[#171719] bg-green" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><strong className="text-xs text-ink">Skor</strong><span className="rounded-full bg-green/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-green">{t("assistantOnline")}</span></div>
        <div className="mt-1.5 flex flex-wrap gap-1.5" aria-label={t("assistantRoles")}>
          <Role icon={BarChart3} label={t("roleAnalyst")} /><Role icon={CircleHelp} label={t("roleGuide")} /><Role icon={BellRing} label={t("roleAlerts")} />
        </div>
      </div>
    </div>
  );
}

function Role({ icon: Icon, label }: { icon: typeof BellRing; label: string }) {
  return <span className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.035] px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-muted"><Icon size={9} className="text-lime" />{label}</span>;
}

import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Eyebrow } from "./ui";
import type { HistoryFact } from "@/lib/football-history";

export function OnThisDay({ fact, fallbackFact }: { fact: HistoryFact | undefined; fallbackFact: string }) {
  const t = useTranslations("onThisDay");
  const isDated = Boolean(fact);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-lime/15 flex items-center justify-center shrink-0">
          <CalendarDays size={16} className="text-lime" />
        </div>
        <Eyebrow>{isDated ? t("eyebrowDated") : t("generalTitle")}</Eyebrow>
      </div>
      {fact && <div className="text-sm font-bold text-lime mb-1">{fact.year}</div>}
      <p className="text-xs text-muted leading-relaxed mb-3">{fact ? fact.text : fallbackFact}</p>
      <Link href="/on-this-day" className="text-[11px] text-lime font-bold">
        {t("seeAll")}
      </Link>
    </div>
  );
}

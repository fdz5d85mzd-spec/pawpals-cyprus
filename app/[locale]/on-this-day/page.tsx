import { CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/predictor/ui";
import { GENERAL_FACTS, getAllFootballHistorySorted, getTodaysFootballHistory } from "@/lib/football-history";

export const dynamic = "force-dynamic";

export default async function OnThisDayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("onThisDay");
  const facts = getAllFootballHistorySorted();
  const today = getTodaysFootballHistory();
  const monthName = (month: number) =>
    new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2000, month - 1, 1));

  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-16">
      <div className="flex items-center gap-2 mb-2 animate-fade-up">
        <CalendarDays size={16} className="text-lime" />
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-dim">{t("kicker")}</span>
      </div>
      <h1 className="font-display text-4xl mb-2 font-extrabold text-ink tracking-tight animate-fade-up" style={{ animationDelay: "60ms" }}>
        {t("title")}
      </h1>
      <p className="text-sm text-muted mb-8 animate-fade-up" style={{ animationDelay: "120ms" }}>
        {t("subtitle")}
      </p>

      <div className="grid sm:grid-cols-2 gap-2 mb-10">
        {facts.map((f) => {
          const isToday = today === f;
          return (
            <div key={`${f.month}-${f.day}-${f.year}`} className={`card p-4 ${isToday ? "border-lime/60" : ""}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono font-bold text-lime uppercase">
                  {f.day} {monthName(f.month)} {f.year}
                </span>
                {isToday && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold font-mono bg-lime text-bg uppercase">
                    {t("todayBadge")}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted leading-relaxed">{f.text}</p>
            </div>
          );
        })}
      </div>

      <Eyebrow>{t("generalTitle")}</Eyebrow>
      <div className="grid sm:grid-cols-2 gap-2">
        {GENERAL_FACTS.map((fact) => (
          <div key={fact} className="card p-4">
            <p className="text-xs text-muted leading-relaxed">{fact}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

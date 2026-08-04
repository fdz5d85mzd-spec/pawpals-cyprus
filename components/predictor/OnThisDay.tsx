import { CalendarDays } from "lucide-react";
import { Eyebrow } from "./ui";
import type { HistoryFact } from "@/lib/football-history";

export function OnThisDay({ fact }: { fact: HistoryFact | undefined }) {
  if (!fact) return null;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays size={13} className="text-dim" />
        <Eyebrow>Σαν σήμερα</Eyebrow>
      </div>
      <div className="text-sm font-bold text-lime mb-1">{fact.year}</div>
      <p className="text-xs text-muted leading-relaxed">{fact.text}</p>
    </div>
  );
}

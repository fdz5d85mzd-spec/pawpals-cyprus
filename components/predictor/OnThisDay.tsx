import { CalendarDays } from "lucide-react";
import { Eyebrow } from "./ui";
import type { HistoryFact } from "@/lib/football-history";

export function OnThisDay({ fact, fallbackFact }: { fact: HistoryFact | undefined; fallbackFact: string }) {
  const isDated = Boolean(fact);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-lime/15 flex items-center justify-center shrink-0">
          <CalendarDays size={16} className="text-lime" />
        </div>
        <Eyebrow>{isDated ? "Σαν σήμερα" : "Ξέρεις ότι..."}</Eyebrow>
      </div>
      {fact && <div className="text-sm font-bold text-lime mb-1">{fact.year}</div>}
      <p className="text-xs text-muted leading-relaxed">{fact ? fact.text : fallbackFact}</p>
    </div>
  );
}

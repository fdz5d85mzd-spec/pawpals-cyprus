import Link from "next/link";
import { Flame } from "lucide-react";
import { Eyebrow } from "./ui";
import type { PresentedPrediction } from "@/lib/present";

export function PickOfDay({
  fixtureId,
  homeName,
  awayName,
  model,
}: {
  fixtureId: number;
  homeName: string;
  awayName: string;
  model: PresentedPrediction;
}) {
  const pick = model.winHome >= model.draw && model.winHome >= model.winAway
    ? { label: homeName, pct: model.winHome }
    : model.winAway >= model.draw && model.winAway >= model.winHome
    ? { label: awayName, pct: model.winAway }
    : { label: "Ισοπαλία", pct: model.draw };

  return (
    <Link href={`/match/${fixtureId}`} className="card-interactive block p-5 border-lime/40">
      <div className="flex items-center gap-2 mb-1">
        <Flame size={13} className="text-lime" />
        <Eyebrow>Πρόταση της ημέρας</Eyebrow>
      </div>
      <div className="text-xs text-muted mb-3">
        {homeName} – {awayName}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="font-display text-xl text-ink font-bold">{pick.label}</div>
          <div className="text-[10px] text-dim mt-0.5">Υψηλότερη confidence του μοντέλου σήμερα</div>
        </div>
        <div className="font-display text-3xl font-mono text-lime shrink-0">{pick.pct}%</div>
      </div>
    </Link>
  );
}

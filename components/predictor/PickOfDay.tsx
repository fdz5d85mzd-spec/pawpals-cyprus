import Link from "next/link";
import { Flame, Clock } from "lucide-react";
import { Eyebrow } from "./ui";
import type { PresentedPrediction } from "@/lib/present";

// Team/league crest images are user-controlled remote URLs from the
// API-Football sync, not something next/image's static import list can
// cover — plain <img> avoids fighting the Next image optimizer's domain
// allowlist for a decorative logo.
function Crest({ src, alt }: { src: string | null | undefined; alt: string }) {
  if (!src) return <div className="w-10 h-10 rounded-full bg-surface3 border border-border shrink-0" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="w-10 h-10 object-contain shrink-0" />;
}

export function PickOfDay({
  fixtureId,
  homeName,
  awayName,
  homeLogoUrl,
  awayLogoUrl,
  leagueName,
  kickoff,
  model,
}: {
  fixtureId: number;
  homeName: string;
  awayName: string;
  homeLogoUrl?: string | null;
  awayLogoUrl?: string | null;
  leagueName?: string | null;
  kickoff?: Date;
  model: PresentedPrediction;
}) {
  const pick =
    model.winHome >= model.draw && model.winHome >= model.winAway
      ? { label: homeName, pct: model.winHome }
      : model.winAway >= model.draw && model.winAway >= model.winHome
      ? { label: awayName, pct: model.winAway }
      : { label: "Ισοπαλία", pct: model.draw };

  const kickoffLabel = kickoff
    ? kickoff.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })
    : null;

  const options = [
    { key: "1", value: model.winHome, active: pick.label === homeName },
    { key: "X", value: model.draw, active: pick.label === "Ισοπαλία" },
    { key: "2", value: model.winAway, active: pick.label === awayName },
  ];

  return (
    <Link href={`/match/${fixtureId}`} className="card-interactive block p-5 border-lime/40">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Flame size={13} className="text-lime" />
          <Eyebrow>Πρόταση της ημέρας</Eyebrow>
        </div>
        {kickoffLabel && (
          <div className="flex items-center gap-1 text-[10px] font-mono text-dim shrink-0">
            <Clock size={11} />
            {kickoffLabel}
          </div>
        )}
      </div>
      {leagueName && <div className="text-[9px] uppercase tracking-wide font-mono text-dim mb-4">{leagueName}</div>}

      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex-1 flex flex-col items-center gap-1.5 text-center min-w-0">
          <Crest src={homeLogoUrl} alt="" />
          <div className="text-xs font-bold text-ink leading-tight truncate w-full">{homeName}</div>
        </div>
        <div className="font-display text-[10px] font-extrabold px-2 py-1 bg-surface3 text-lime border border-lime/40 shrink-0">
          VS
        </div>
        <div className="flex-1 flex flex-col items-center gap-1.5 text-center min-w-0">
          <Crest src={awayLogoUrl} alt="" />
          <div className="text-xs font-bold text-ink leading-tight truncate w-full">{awayName}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {options.map((o) => (
          <div
            key={o.key}
            className={`py-2 text-center border rounded ${
              o.active ? "bg-lime/15 border-lime text-lime" : "bg-surface2 border-border text-muted"
            }`}
          >
            <div className="text-[9px] font-mono uppercase mb-0.5 opacity-70">{o.key}</div>
            <div className="font-display font-bold text-sm">{o.value}%</div>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-dim">
        Το μοντέλο δίνει προβάδισμα σε <span className="text-ink font-bold">{pick.label}</span>
      </div>
    </Link>
  );
}

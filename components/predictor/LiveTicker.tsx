"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

interface LiveScore {
  fixtureId: number;
  homeName: string;
  awayName: string;
  homeGoals: number;
  awayGoals: number;
  elapsed: number | null;
  statusShort: string;
}

function minuteLabel(score: LiveScore): string {
  if (score.statusShort === "HT") return "ΗΜ";
  return score.elapsed != null ? `${score.elapsed}'` : "LIVE";
}

// Separate from the prediction Ticker — this one shows real, live scores
// for matches in progress, polled from /api/live-scores. Renders nothing
// when nothing is live right now, so it never shows an empty bar.
export function LiveTicker() {
  const [scores, setScores] = useState<LiveScore[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/live-scores");
        const data = await res.json();
        if (!cancelled) setScores(data.scores ?? []);
      } catch {
        // stay on whatever we last had rather than flashing empty
      }
    }
    poll();
    const interval = setInterval(poll, 45_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (scores.length === 0) return null;

  const loop = [...scores, ...scores];

  return (
    <div className="relative overflow-hidden border-b-2 border-rose bg-surface2">
      <div className="flex w-max animate-marquee py-2.5">
        {loop.map((s, i) => (
          <Link
            key={i}
            href={`/match/${s.fixtureId}`}
            className="flex items-center gap-2 text-[11px] font-mono px-6 border-r border-border/50 shrink-0 hover:text-rose transition-colors"
          >
            <span className="text-rose font-bold uppercase tracking-wide text-[9px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose animate-pulse" />
              {minuteLabel(s)}
            </span>
            <span className="text-muted">
              {s.homeName} <b className="text-ink">{s.homeGoals}-{s.awayGoals}</b> {s.awayName}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

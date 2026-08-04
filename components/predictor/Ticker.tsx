import { Link } from "@/i18n/navigation";

export interface TickerItem {
  fixtureId: number;
  homeName: string;
  awayName: string;
  pickLabel: string;
  pct: number;
}

// Same scrolling-bar look as the odds tickers on betting sites, but with our
// own model confidence % instead of bookmaker odds — keeps the "statistical
// tool, not a betting service" positioning intact.
export function Ticker({ items }: { items: TickerItem[] }) {
  if (items.length === 0) return null;

  const loop = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-b-2 border-lime bg-surface2">
      <div className="flex w-max animate-marquee py-2.5">
        {loop.map((it, i) => (
          <Link
            key={i}
            href={`/match/${it.fixtureId}`}
            className="flex items-center gap-2 text-[11px] font-mono px-6 border-r border-border/50 shrink-0 hover:text-lime transition-colors"
          >
            <span className="text-dim">
              {it.homeName} – {it.awayName}
            </span>
            <span className="text-lime font-bold">
              {it.pickLabel} {it.pct}%
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { Eyebrow } from "./ui";

export interface TopPickItem {
  fixtureId: number;
  homeName: string;
  awayName: string;
  pickLabel: string;
  pct: number;
}

// Independent picks, each on its own — deliberately NOT bundled into a
// single combined-odds "coupon"/accumulator (see brief's note on EEEP
// gambling-regulation risk: this stays a statistics digest, not a bet slip).
export function TopPicks({ items }: { items: TopPickItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={13} className="text-dim" />
        <Eyebrow>Κορυφαίες προτάσεις</Eyebrow>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.fixtureId}
            href={`/match/${item.fixtureId}`}
            className="flex items-center justify-between py-2 px-3 bg-surface2 hover:bg-surface3 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-[11px] text-muted truncate">
                {item.homeName} – {item.awayName}
              </div>
              <div className="text-xs font-bold text-ink">{item.pickLabel}</div>
            </div>
            <div className="text-sm font-mono font-bold text-lime shrink-0 ml-2">{item.pct}%</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

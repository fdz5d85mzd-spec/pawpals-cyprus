import { Target, Flame, Trophy, Medal, Calendar, Star } from "lucide-react";
import type { Badge } from "@/lib/badges";

const ICONS = { target: Target, flame: Flame, trophy: Trophy, medal: Medal, calendar: Calendar, star: Star };

export function BadgeRow({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => {
        const Icon = ICONS[b.icon];
        return (
          <span
            key={b.key}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-lime/10 text-lime border border-lime/30"
          >
            <Icon size={12} />
            {b.label}
          </span>
        );
      })}
    </div>
  );
}

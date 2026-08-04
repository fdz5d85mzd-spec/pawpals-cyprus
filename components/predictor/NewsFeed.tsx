import { Newspaper } from "lucide-react";
import { Eyebrow } from "./ui";
import type { NewsItem } from "@/lib/news";

export function NewsFeed({ items }: { items: NewsItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Newspaper size={13} className="text-dim" />
        <Eyebrow>Τελευταία νέα</Eyebrow>
      </div>
      <div className="space-y-2">
        {items.map((n, i) => (
          <a
            key={i}
            href={n.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block py-2 px-3 bg-surface2 hover:bg-surface3 transition-colors"
          >
            <div className="text-xs text-ink leading-snug">{n.title}</div>
            <div className="text-[9px] text-dim mt-1 uppercase tracking-wide font-mono">{n.source}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

import { XMLParser } from "fast-xml-parser";

// Headline + outbound link only — never reproduces article bodies. Lets the
// homepage feel "alive" with sports news without touching the copyright risk
// of republishing other outlets' content (unlike tipster sites that lift
// whole analyses).
export interface NewsItem {
  title: string;
  link: string;
  pubDate?: string;
  source: string;
}

const FEEDS: { url: string; source: string }[] = [
  // The previous "/rss.xml" and "/rss/all" paths both 404'd — these sites
  // restructure their feed URLs periodically without redirects.
  { url: "https://www.gazzetta.gr/rss", source: "Gazzetta" },
  // BBC's feed is built for wide syndication and reliably returns content —
  // kept as a always-on source since Greek outlets' feed URLs keep moving.
  { url: "http://feeds.bbci.co.uk/sport/football/rss.xml", source: "BBC Sport" },
];

const parser = new XMLParser({ ignoreAttributes: false });

interface RssItem {
  title?: unknown;
  link?: unknown;
  pubDate?: unknown;
}

async function fetchFeed(feed: { url: string; source: string }): Promise<{ items: NewsItem[]; error?: string }> {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SkoramaBot/1.0; +https://skorama.xyz)" },
      // Headlines don't need to be second-fresh; a short edge cache keeps
      // this from re-fetching both feeds on every homepage render.
      next: { revalidate: 900 },
    });
    if (!res.ok) {
      const error = `HTTP ${res.status}`;
      console.error(`news feed ${feed.source} failed: ${error}`);
      return { items: [], error };
    }

    const xml = await res.text();
    const parsed = parser.parse(xml);
    const rawItems = parsed?.rss?.channel?.item ?? [];
    const items: RssItem[] = Array.isArray(rawItems) ? rawItems : [rawItems];

    return {
      items: items
        .slice(0, 8)
        .map((it) => ({
          title: String(it.title ?? "").trim(),
          link: String(it.link ?? "").trim(),
          pubDate: typeof it.pubDate === "string" ? it.pubDate : undefined,
          source: feed.source,
        }))
        .filter((n) => n.title && n.link),
    };
  } catch (err) {
    // A feed being down/blocked shouldn't take the homepage with it.
    const error = err instanceof Error ? err.message : String(err);
    console.error(`news feed ${feed.source} failed: ${error}`);
    return { items: [], error };
  }
}

export async function getLatestSportsNews(limit = 6): Promise<NewsItem[]> {
  const results = await Promise.all(FEEDS.map(fetchFeed));
  const merged = results.flatMap((r) => r.items);
  merged.sort((a, b) => {
    const ta = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const tb = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return tb - ta;
  });
  return merged.slice(0, limit);
}

// Debug helper for /api/cron/debug-news — surfaces per-feed status so a
// blocked/broken feed can be diagnosed from a browser instead of needing
// Vercel function log access.
export async function getNewsFeedDiagnostics() {
  const results = await Promise.all(
    FEEDS.map(async (feed) => {
      const { items, error } = await fetchFeed(feed);
      return { source: feed.source, url: feed.url, itemCount: items.length, error: error ?? null };
    })
  );
  return results;
}

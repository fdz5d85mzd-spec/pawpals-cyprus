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
  { url: "https://www.gazzetta.gr/rss.xml", source: "Gazzetta" },
  { url: "https://www.sdna.gr/rss/all", source: "SDNA" },
];

const parser = new XMLParser({ ignoreAttributes: false });

interface RssItem {
  title?: unknown;
  link?: unknown;
  pubDate?: unknown;
}

async function fetchFeed(feed: { url: string; source: string }): Promise<NewsItem[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SkoramaBot/1.0; +https://skorama.xyz)" },
      // Headlines don't need to be second-fresh; a short edge cache keeps
      // this from re-fetching both feeds on every homepage render.
      next: { revalidate: 900 },
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const parsed = parser.parse(xml);
    const rawItems = parsed?.rss?.channel?.item ?? [];
    const items: RssItem[] = Array.isArray(rawItems) ? rawItems : [rawItems];

    return items
      .slice(0, 8)
      .map((it) => ({
        title: String(it.title ?? "").trim(),
        link: String(it.link ?? "").trim(),
        pubDate: typeof it.pubDate === "string" ? it.pubDate : undefined,
        source: feed.source,
      }))
      .filter((n) => n.title && n.link);
  } catch {
    // A feed being down/blocked shouldn't take the homepage with it.
    return [];
  }
}

export async function getLatestSportsNews(limit = 6): Promise<NewsItem[]> {
  const results = await Promise.all(FEEDS.map(fetchFeed));
  const merged = results.flat();
  merged.sort((a, b) => {
    const ta = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const tb = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return tb - ta;
  });
  return merged.slice(0, limit);
}

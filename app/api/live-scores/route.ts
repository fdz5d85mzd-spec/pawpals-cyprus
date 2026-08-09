import { NextResponse } from "next/server";
import { getLiveFixtures } from "@/lib/api-football";

export const dynamic = "force-dynamic";

// Public, unauthenticated — the LiveTicker client component polls this
// directly. Backed by afFetch's own 30s Next.js fetch cache, so repeated
// client polls within that window don't each trigger a fresh API-Football
// call, regardless of how many visitors are polling at once.
export async function GET() {
  try {
    const scores = await getLiveFixtures();
    return NextResponse.json({ scores });
  } catch (err) {
    return NextResponse.json({ scores: [], error: err instanceof Error ? err.message : String(err) });
  }
}

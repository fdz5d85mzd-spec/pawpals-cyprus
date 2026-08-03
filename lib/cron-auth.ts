import { NextRequest, NextResponse } from "next/server";

// Vercel Cron calls these routes with `Authorization: Bearer $CRON_SECRET`
// when CRON_SECRET is set. A `?secret=` query param is also accepted so a
// human can trigger/inspect a run directly from a browser address bar.
export function cronAuthError(req: NextRequest): NextResponse | null {
  const auth = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET;
  if (auth !== `Bearer ${expected}` && querySecret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

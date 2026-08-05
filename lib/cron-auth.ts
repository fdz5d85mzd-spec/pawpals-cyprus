import { NextRequest, NextResponse } from "next/server";

// Vercel Cron calls these routes with `Authorization: Bearer $CRON_SECRET`
// when CRON_SECRET is set. A `?secret=` query param is also accepted so a
// human can trigger/inspect a run directly from a browser address bar.
//
// Trimmed on both sides: a value pasted into Vercel's env var UI (or typed
// into a browser URL) can pick up an invisible trailing space or newline
// that silently breaks the exact-match check below forever — trimming
// removes that whole class of "I definitely pasted the right value" bugs.
export function cronAuthError(req: NextRequest): NextResponse | null {
  const auth = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret")?.trim();
  const expected = process.env.CRON_SECRET?.trim();
  if (auth?.trim() !== `Bearer ${expected}` && querySecret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

import { NextRequest, NextResponse } from "next/server";

// Vercel Cron calls these routes with `Authorization: Bearer $CRON_SECRET`
// when CRON_SECRET is set — this rejects any other caller.
export function cronAuthError(req: NextRequest): NextResponse | null {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

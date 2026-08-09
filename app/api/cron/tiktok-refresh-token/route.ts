import { NextRequest, NextResponse } from "next/server";
import { cronAuthError } from "@/lib/cron-auth";
import { prisma } from "@/lib/db";
import { getValidTikTokAccessToken } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

// Runs every few hours — keeps the access token from ever going stale
// between actual posts. No-ops if TikTok isn't connected yet.
export async function GET(req: NextRequest) {
  const authError = cronAuthError(req);
  if (authError) return authError;

  const auth = await prisma.tikTokAuth.findUnique({ where: { id: "singleton" } });
  if (!auth) return NextResponse.json({ ok: true, skipped: "not_connected" });

  try {
    await getValidTikTokAccessToken();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { cronAuthError } from "@/lib/cron-auth";
import { getNewsFeedDiagnostics } from "@/lib/news";

export const dynamic = "force-dynamic";

// Temporary diagnostic endpoint — shows per-feed fetch status so a
// blocked/broken RSS source can be identified from a browser URL.
export async function GET(req: NextRequest) {
  const authError = cronAuthError(req);
  if (authError) return authError;

  const diagnostics = await getNewsFeedDiagnostics();
  return NextResponse.json({ feeds: diagnostics });
}

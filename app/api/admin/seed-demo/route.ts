import { NextRequest, NextResponse } from "next/server";
import { cronAuthError } from "@/lib/cron-auth";
import { prisma } from "@/lib/db";
import { seedDemoData } from "@/lib/demo-seed";

export const dynamic = "force-dynamic";

// TEMPORARY: real leagues are between seasons right now (see conversation —
// European leagues start Aug 16-28, MLS/Liga MX are paused for Leagues Cup).
// This inserts one demo fixture with a real computeModel prediction plus a
// handful of finished/graded matches, so the site isn't empty in the
// meantime. Delete this route (and the seeded rows, ids 1/2/101-108/1001)
// once real fixtures are flowing via sync-fixtures.
export async function GET(req: NextRequest) {
  const authError = cronAuthError(req);
  if (authError) return authError;

  await seedDemoData(prisma);

  return NextResponse.json({ ok: true, note: "Demo fixture + history seeded. Remove once real leagues are in season." });
}

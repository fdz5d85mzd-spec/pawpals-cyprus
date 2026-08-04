import { NextRequest, NextResponse } from "next/server";
import { cronAuthError } from "@/lib/cron-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Temporary diagnostic: lists what's actually in the Fixture table and how
// far away kickoff is, to debug why freeze-predictions did/didn't pick
// something up. Safe to delete once things are working end to end.
export async function GET(req: NextRequest) {
  const authError = cronAuthError(req);
  if (authError) return authError;

  const now = new Date();
  const fixtures = await prisma.fixture.findMany({
    include: { homeTeam: true, awayTeam: true, prediction: true },
    orderBy: { kickoff: "asc" },
    take: 30,
  });

  return NextResponse.json({
    now: now.toISOString(),
    count: fixtures.length,
    fixtures: fixtures.map((f) => ({
      id: f.id,
      match: `${f.homeTeam.name} - ${f.awayTeam.name}`,
      kickoff: f.kickoff.toISOString(),
      hoursFromNow: Math.round((f.kickoff.getTime() - now.getTime()) / 3600000),
      hasPrediction: !!f.prediction,
    })),
  });
}

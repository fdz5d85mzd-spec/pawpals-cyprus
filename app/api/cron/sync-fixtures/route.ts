import { NextRequest, NextResponse } from "next/server";
import { cronAuthError } from "@/lib/cron-auth";
import { getFixturesInWindow } from "@/lib/api-football";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Runs a few times a day: pulls fixtures kicking off in the next 48h and
// upserts League/Team/Fixture rows so the rest of the app (and the
// freeze-predictions job) can read from Postgres instead of hitting
// API-Football on every request.
export async function GET(req: NextRequest) {
  const authError = cronAuthError(req);
  if (authError) return authError;

  let fixtures, leagueErrors;
  try {
    ({ fixtures, leagueErrors } = await getFixturesInWindow(48));
  } catch (err) {
    return NextResponse.json(
      { ok: false, fixturesSynced: 0, error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
  let upserted = 0;

  for (const f of fixtures) {
    await prisma.league.upsert({
      where: { id: f.league.id },
      create: { id: f.league.id, name: f.league.name, country: f.league.country, season: f.league.season },
      update: { season: f.league.season, name: f.league.name, country: f.league.country },
    });

    await prisma.team.upsert({
      where: { id: f.teams.home.id },
      create: {
        id: f.teams.home.id,
        name: f.teams.home.name,
        shortName: f.teams.home.name.slice(0, 4).toUpperCase(),
        leagueId: f.league.id,
      },
      update: { name: f.teams.home.name },
    });
    await prisma.team.upsert({
      where: { id: f.teams.away.id },
      create: {
        id: f.teams.away.id,
        name: f.teams.away.name,
        shortName: f.teams.away.name.slice(0, 4).toUpperCase(),
        leagueId: f.league.id,
      },
      update: { name: f.teams.away.name },
    });

    await prisma.fixture.upsert({
      where: { id: f.fixture.id },
      create: {
        id: f.fixture.id,
        leagueId: f.league.id,
        homeTeamId: f.teams.home.id,
        awayTeamId: f.teams.away.id,
        kickoff: new Date(f.fixture.date),
        venue: f.fixture.venue.name ?? undefined,
      },
      update: { kickoff: new Date(f.fixture.date), venue: f.fixture.venue.name ?? undefined },
    });

    upserted++;
  }

  return NextResponse.json({ ok: true, fixturesSynced: upserted, leagueErrors });
}

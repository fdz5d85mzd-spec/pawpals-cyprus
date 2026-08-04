import { NextRequest, NextResponse } from "next/server";
import { cronAuthError } from "@/lib/cron-auth";
import { getStandings, TRACKED_LEAGUES, currentSeasonYear } from "@/lib/api-football";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Runs daily: pulls the full table for every tracked league and upserts
// Standing rows for the /standings page. Separate from the leaguePos field
// on Team (which only gets refreshed opportunistically, per-team, whenever
// a prediction happens to be frozen for it).
export async function GET(req: NextRequest) {
  const authError = cronAuthError(req);
  if (authError) return authError;

  const season = currentSeasonYear();
  let rowsUpserted = 0;
  const errors: { league: number; error: string }[] = [];

  for (const league of TRACKED_LEAGUES) {
    try {
      const { leagueMeta, rows } = await getStandings(league.id, season);
      if (!leagueMeta || rows.length === 0) continue;

      await prisma.league.upsert({
        where: { id: league.id },
        create: { id: league.id, name: leagueMeta.name, country: leagueMeta.country, season: leagueMeta.season },
        update: { name: leagueMeta.name, country: leagueMeta.country, season: leagueMeta.season },
      });

      for (const row of rows) {
        // Only keep standings for teams we already track via sync-fixtures —
        // avoids a Team FK violation for clubs that haven't shown up in our
        // fixture window yet.
        const team = await prisma.team.findUnique({ where: { id: row.team.id } });
        if (!team) continue;

        await prisma.standing.upsert({
          where: { leagueId_teamId: { leagueId: league.id, teamId: row.team.id } },
          create: {
            leagueId: league.id,
            teamId: row.team.id,
            rank: row.rank,
            points: row.points,
            played: row.all.played,
            win: row.all.win,
            draw: row.all.draw,
            lose: row.all.lose,
            goalsFor: row.all.goals.for,
            goalsAgainst: row.all.goals.against,
            form: row.form,
          },
          update: {
            rank: row.rank,
            points: row.points,
            played: row.all.played,
            win: row.all.win,
            draw: row.all.draw,
            lose: row.all.lose,
            goalsFor: row.all.goals.for,
            goalsAgainst: row.all.goals.against,
            form: row.form,
          },
        });
        rowsUpserted++;
      }
    } catch (err) {
      errors.push({ league: league.id, error: err instanceof Error ? err.message : String(err) });
    }
    await sleep(800);
  }

  return NextResponse.json({ ok: true, rowsUpserted, errors });
}

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { cronAuthError } from "@/lib/cron-auth";
import { buildTeamStats, getStandings } from "@/lib/api-football";
import { computeModel } from "@/lib/model";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Runs daily. Finds fixtures kicking off in the next 24h that don't have a
// prediction yet, runs the model, and stores the result as an immutable
// PredictionSnapshot — "frozen" so odds/lineups moving later can't be used
// to retroactively change what we predicted.
export async function GET(req: NextRequest) {
  const authError = cronAuthError(req);
  if (authError) return authError;

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 3600 * 1000);

  const fixtures = await prisma.fixture.findMany({
    where: {
      kickoff: { gte: now, lte: in24h },
      prediction: null,
    },
    include: { homeTeam: true, awayTeam: true, league: true },
  });

  const standingsCache = new Map<number, Awaited<ReturnType<typeof getStandings>>>();
  let frozen = 0;
  const errors: { fixtureId: number; error: string }[] = [];

  for (const fixture of fixtures) {
    try {
      let standings = standingsCache.get(fixture.leagueId);
      if (!standings) {
        standings = await getStandings(fixture.leagueId, fixture.league.season);
        standingsCache.set(fixture.leagueId, standings);
      }

      const [home, away] = await Promise.all([
        buildTeamStats({
          teamId: fixture.homeTeamId,
          teamName: fixture.homeTeam.name,
          shortName: fixture.homeTeam.shortName,
          leagueId: fixture.leagueId,
          season: fixture.league.season,
          standings,
        }),
        buildTeamStats({
          teamId: fixture.awayTeamId,
          teamName: fixture.awayTeam.name,
          shortName: fixture.awayTeam.shortName,
          leagueId: fixture.leagueId,
          season: fixture.league.season,
          standings,
        }),
      ]);

      const model = computeModel({ home, away });

      await prisma.predictionSnapshot.create({
        data: {
          fixtureId: fixture.id,
          lambdaHome: model.lambdaHome,
          lambdaAway: model.lambdaAway,
          winHome: model.winHome,
          draw: model.draw,
          winAway: model.winAway,
          doubleChance: model.doubleChance,
          bttsYes: model.bttsYes,
          ouLines: model.ouLines,
          scores: model.scores,
          asianHandicap: model.asianHandicap,
          htft: model.htft,
          htftConfidence: model.htftConfidence,
          corners: model.corners,
          cornersOver95: model.cornersOver95,
          cards: model.cards,
          cardsOver45: model.cardsOver45,
          scorer: model.scorer ? (model.scorer as unknown as Prisma.InputJsonObject) : Prisma.JsonNull,
          confidence: model.confidence,
          matrix: model.matrix,
        },
      });

      // Opportunistically refresh the team cache with what we just fetched.
      await prisma.team.update({
        where: { id: fixture.homeTeamId },
        data: {
          leaguePos: home.leaguePos,
          avgGoalsFor: home.avgGoalsFor,
          avgGoalsAgainst: home.avgGoalsAgainst,
          form: home.form,
          statsUpdatedAt: new Date(),
        },
      });
      await prisma.team.update({
        where: { id: fixture.awayTeamId },
        data: {
          leaguePos: away.leaguePos,
          avgGoalsFor: away.avgGoalsFor,
          avgGoalsAgainst: away.avgGoalsAgainst,
          form: away.form,
          statsUpdatedAt: new Date(),
        },
      });

      frozen++;
    } catch (err) {
      errors.push({ fixtureId: fixture.id, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({ ok: true, predictionsFrozen: frozen, errors });
}

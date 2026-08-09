import { NextRequest, NextResponse } from "next/server";
import { cronAuthError } from "@/lib/cron-auth";
import { getFixtureById } from "@/lib/api-football";
import { gradePrediction } from "@/lib/settle";
import { prisma } from "@/lib/db";
import { FixtureStatus } from "@prisma/client";
import { getWebPushClient } from "@/lib/push";

export const dynamic = "force-dynamic";

// Runs daily (or a few times a day). Finds fixtures that should have
// finished by now and still have no graded results, fetches the real
// score from API-Football, and compares it against the frozen prediction —
// one PredictionResult row per market.
export async function GET(req: NextRequest) {
  const authError = cronAuthError(req);
  if (authError) return authError;

  const cutoff = new Date(Date.now() - 2 * 3600 * 1000); // kickoff + ~2h = plausibly over

  const fixtures = await prisma.fixture.findMany({
    where: {
      kickoff: { lte: cutoff },
      status: { not: FixtureStatus.FINISHED },
      prediction: { isNot: null },
    },
    include: { prediction: true, homeTeam: true, awayTeam: true },
  });

  const webpush = process.env.VAPID_PRIVATE_KEY ? getWebPushClient() : null;

  let settled = 0;
  const errors: { fixtureId: number; error: string }[] = [];

  for (const fixture of fixtures) {
    try {
      const af = await getFixtureById(fixture.id);
      if (!af || af.fixture.status.short !== "FT") continue; // not finished yet
      if (af.goals.home === null || af.goals.away === null) continue;

      await prisma.fixture.update({
        where: { id: fixture.id },
        data: {
          status: FixtureStatus.FINISHED,
          homeGoals: af.goals.home,
          awayGoals: af.goals.away,
          htHomeGoals: af.score.halftime.home,
          htAwayGoals: af.score.halftime.away,
        },
      });

      if (!fixture.prediction) continue;

      const grades = gradePrediction(fixture.prediction, {
        homeGoals: af.goals.home,
        awayGoals: af.goals.away,
        htHomeGoals: af.score.halftime.home,
        htAwayGoals: af.score.halftime.away,
      });

      await prisma.predictionResult.createMany({
        data: grades.map((g) => ({
          predictionId: fixture.prediction!.id,
          market: g.market,
          predicted: g.predicted,
          predictedPct: g.predictedPct,
          actual: g.actual,
          hit: g.hit,
        })),
        skipDuplicates: true,
      });

      // Grade every user's own 1X2 guess against the real result — powers
      // the personal accuracy tracker on /account and /leaderboard.
      const actualPick = af.goals.home > af.goals.away ? "HOME" : af.goals.home < af.goals.away ? "AWAY" : "DRAW";
      await prisma.userPick.updateMany({ where: { fixtureId: fixture.id, pick: actualPick }, data: { hit: true } });
      await prisma.userPick.updateMany({
        where: { fixtureId: fixture.id, pick: { not: actualPick } },
        data: { hit: false },
      });

      // Best-effort, per-user "your pick was right/wrong" push — separate
      // from the daily digest's single broadcast message, since this one
      // differs per recipient depending on what they actually picked.
      if (webpush) {
        const userPicks = await prisma.userPick.findMany({
          where: { fixtureId: fixture.id },
          include: { user: { include: { pushSubscriptions: true } } },
        });
        const scoreLine = `${af.goals.home}-${af.goals.away}`;
        for (const up of userPicks) {
          const payload = JSON.stringify({
            title: up.hit ? "Το πέτυχες! 🎯" : "Δεν το πέτυχες αυτή τη φορά",
            body: `${fixture.homeTeam.name} ${scoreLine} ${fixture.awayTeam.name}`,
            url: `/match/${fixture.id}`,
          });
          for (const sub of up.user.pushSubscriptions) {
            try {
              await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
            } catch (err) {
              const statusCode = (err as { statusCode?: number }).statusCode;
              if (statusCode === 404 || statusCode === 410) {
                await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
              }
            }
          }
        }
      }

      settled++;
    } catch (err) {
      errors.push({ fixtureId: fixture.id, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({ ok: true, fixturesSettled: settled, errors });
}

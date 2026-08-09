import { NextRequest, NextResponse } from "next/server";
import { cronAuthError } from "@/lib/cron-auth";
import { prisma } from "@/lib/db";
import { postToFacebookPage } from "@/lib/facebook";
import { buildCorrectPredictionPost, buildPickOfDayPost, buildWeeklyAccuracyPost } from "@/lib/social-copy";
import { getOverallAccuracy } from "@/lib/accuracy";

export const dynamic = "force-dynamic";

function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / 604800000);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function startOfIsoWeek(d: Date): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7; // Sun=0 -> 7
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  return date;
}

async function alreadyPosted(kind: string, refId: string): Promise<boolean> {
  const existing = await prisma.socialPost.findUnique({
    where: { kind_refId_platform: { kind, refId, platform: "facebook" } },
  });
  return !!existing;
}

async function recordPost(kind: string, refId: string, message: string) {
  await prisma.socialPost.create({ data: { kind, refId, platform: "facebook", message } });
}

// Runs twice a day (see vercel.json). Posts AT MOST one thing per run, in
// priority order, so the Page never gets spammed:
//   1. The most confident correct 1X2 result settled in the last ~36h that
//      hasn't been posted yet — real proof, not a promise.
//   2. Otherwise, today's highest-confidence upcoming pick, once per day.
//   3. Otherwise, on Mondays, a weekly accuracy recap, once per week.
// Requires FACEBOOK_PAGE_ID + FACEBOOK_PAGE_ACCESS_TOKEN — no-ops (not an
// error) until those are set, so this is safe to deploy before Facebook
// setup is finished.
export async function GET(req: NextRequest) {
  const authError = cronAuthError(req);
  if (authError) return authError;

  if (!process.env.FACEBOOK_PAGE_ID || !process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    return NextResponse.json({ ok: true, skipped: "facebook_not_configured" });
  }

  try {
    const since36h = new Date(Date.now() - 36 * 3600 * 1000);
    const correctResults = await prisma.predictionResult.findMany({
      where: { market: "ONE_X_TWO", hit: true, settledAt: { gte: since36h } },
      include: { prediction: { include: { fixture: { include: { homeTeam: true, awayTeam: true, league: true } } } } },
      orderBy: { predictedPct: "desc" },
    });

    for (const result of correctResults) {
      const fixture = result.prediction.fixture;
      const refId = String(fixture.id);
      if (await alreadyPosted("correct_prediction", refId)) continue;
      if (fixture.homeGoals == null || fixture.awayGoals == null) continue;

      const message = buildCorrectPredictionPost({
        homeName: fixture.homeTeam.name,
        awayName: fixture.awayTeam.name,
        homeGoals: fixture.homeGoals,
        awayGoals: fixture.awayGoals,
        predicted: result.predicted,
        predictedPct: result.predictedPct,
        leagueName: fixture.league.name,
      });
      const posted = await postToFacebookPage(message);
      await recordPost("correct_prediction", refId, message);
      return NextResponse.json({ ok: true, posted: "correct_prediction", refId, facebookPostId: posted.id });
    }

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 3600 * 1000);
    const upcoming = await prisma.fixture.findMany({
      where: { kickoff: { gte: now, lte: in24h }, prediction: { isNot: null } },
      include: { prediction: true, homeTeam: true, awayTeam: true, league: true },
      orderBy: { kickoff: "asc" },
    });
    const byConfidence = upcoming
      .filter((f) => f.prediction)
      .sort((a, b) => b.prediction!.confidence - a.prediction!.confidence);

    for (const fixture of byConfidence) {
      const refId = String(fixture.id);
      if (await alreadyPosted("pick_of_day", refId)) continue;

      const p = fixture.prediction!;
      const pick1x2 = p.winHome >= p.draw && p.winHome >= p.winAway ? "1" : p.winAway >= p.draw && p.winAway >= p.winHome ? "2" : "X";
      const predictedPct = pick1x2 === "1" ? p.winHome : pick1x2 === "2" ? p.winAway : p.draw;

      const message = buildPickOfDayPost({
        homeName: fixture.homeTeam.name,
        awayName: fixture.awayTeam.name,
        predicted: pick1x2,
        predictedPct,
        leagueName: fixture.league.name,
      });
      const posted = await postToFacebookPage(message);
      await recordPost("pick_of_day", refId, message);
      return NextResponse.json({ ok: true, posted: "pick_of_day", refId, facebookPostId: posted.id });
    }

    if (now.getUTCDay() === 1) {
      const weekKey = isoWeekKey(now);
      if (!(await alreadyPosted("weekly_accuracy", weekKey))) {
        const stats = await getOverallAccuracy(startOfIsoWeek(now));
        if (stats.total >= 5) {
          const message = buildWeeklyAccuracyPost(stats);
          const posted = await postToFacebookPage(message);
          await recordPost("weekly_accuracy", weekKey, message);
          return NextResponse.json({ ok: true, posted: "weekly_accuracy", refId: weekKey, facebookPostId: posted.id });
        }
      }
    }

    return NextResponse.json({ ok: true, posted: null });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

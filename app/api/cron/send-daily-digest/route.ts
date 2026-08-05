import { NextRequest, NextResponse } from "next/server";
import { cronAuthError } from "@/lib/cron-auth";
import { prisma } from "@/lib/db";
import { presentPrediction } from "@/lib/present";
import { getResendClient, DIGEST_FROM } from "@/lib/resend";
import { buildDigestEmail, type DigestPick } from "@/lib/digest-email";
import { getWebPushClient } from "@/lib/push";
import { getOverallAccuracy } from "@/lib/accuracy";
import { buildWeeklyRecapEmail } from "@/lib/weekly-recap-email";

export const dynamic = "force-dynamic";

function pickLabelFor(model: { winHome: number; draw: number; winAway: number }, homeName: string, awayName: string) {
  if (model.winHome >= model.draw && model.winHome >= model.winAway) return { label: homeName, pct: model.winHome };
  if (model.winAway >= model.draw && model.winAway >= model.winHome) return { label: awayName, pct: model.winAway };
  return { label: "Ισοπαλία", pct: model.draw };
}

// Runs once daily. Sends the top confidence picks to every user who opted
// in at registration (User.emailUpdatesOptIn) — skipped entirely if there's
// nothing frozen yet, so nobody gets an empty email.
export async function GET(req: NextRequest) {
  const authError = cronAuthError(req);
  if (authError) return authError;

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: "RESEND_API_KEY is not set" }, { status: 500 });
  }

  const fixtures = await prisma.fixture.findMany({
    where: { kickoff: { gte: new Date() }, prediction: { isNot: null } },
    include: { homeTeam: true, awayTeam: true, prediction: true },
    orderBy: { kickoff: "asc" },
    take: 20,
  });

  const picks: DigestPick[] = fixtures
    .filter((f) => f.prediction)
    .map((f) => {
      const model = presentPrediction(f.prediction!);
      const p = pickLabelFor(model, f.homeTeam.name, f.awayTeam.name);
      return { fixtureId: f.id, homeName: f.homeTeam.name, awayName: f.awayTeam.name, pickLabel: p.label, pct: p.pct };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);

  if (picks.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: "no frozen predictions" });
  }

  const recipients = await prisma.user.findMany({
    where: { emailUpdatesOptIn: true },
    select: { email: true },
  });

  const { subject, html } = buildDigestEmail(picks);
  const resend = getResendClient();
  let sent = 0;
  const errors: { email: string; error: string }[] = [];

  for (const { email } of recipients) {
    try {
      await resend.emails.send({ from: DIGEST_FROM, to: email, subject, html });
      sent++;
    } catch (err) {
      errors.push({ email, error: err instanceof Error ? err.message : String(err) });
    }
  }

  // Push is best-effort and independent of email — missing VAPID keys or a
  // dead subscription should never affect the email send above.
  let pushSent = 0;
  if (process.env.VAPID_PRIVATE_KEY) {
    const top = picks[0];
    const subs = await prisma.pushSubscription.findMany();
    const webpush = getWebPushClient();
    const payload = JSON.stringify({
      title: "Πρόγνωση της ημέρας",
      body: `${top.homeName} – ${top.awayName}: ${top.pickLabel} (${top.pct}%)`,
      url: `/match/${top.fixtureId}`,
    });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        pushSent++;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription expired or the user uninstalled/blocked us — clean it up.
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }
  }

  // Weekly recap rides the same daily cron instead of needing its own
  // schedule entry — it just no-ops on the other six days.
  let weeklyRecapSent = 0;
  if (new Date().getUTCDay() === 0) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekly = await getOverallAccuracy(sevenDaysAgo);
    if (weekly.total > 0) {
      const { subject, html } = buildWeeklyRecapEmail(weekly);
      for (const { email } of recipients) {
        try {
          await resend.emails.send({ from: DIGEST_FROM, to: email, subject, html });
          weeklyRecapSent++;
        } catch {
          // Best-effort — the daily digest above already reported per-email errors.
        }
      }
    }
  }

  return NextResponse.json({ ok: true, sent, recipients: recipients.length, pushSent, weeklyRecapSent, errors });
}

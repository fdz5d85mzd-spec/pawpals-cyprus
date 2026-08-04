import { NextRequest, NextResponse } from "next/server";
import { cronAuthError } from "@/lib/cron-auth";
import { prisma } from "@/lib/db";
import { presentPrediction } from "@/lib/present";
import { getResendClient, DIGEST_FROM } from "@/lib/resend";
import { buildDigestEmail, type DigestPick } from "@/lib/digest-email";

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

  return NextResponse.json({ ok: true, sent, recipients: recipients.length, errors });
}

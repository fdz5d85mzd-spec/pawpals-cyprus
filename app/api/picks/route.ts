import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FixtureStatus, PickChoice } from "@prisma/client";

const schema = z.object({
  fixtureId: z.number().int(),
  pick: z.nativeEnum(PickChoice),
});

// Users can set or change their 1X2 guess any time before kickoff — once
// the match starts there's nothing left to guess, so it locks.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { fixtureId, pick } = parsed.data;

  const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } });
  if (!fixture) return NextResponse.json({ error: "Match not found." }, { status: 404 });
  if (fixture.status !== FixtureStatus.SCHEDULED || fixture.kickoff <= new Date()) {
    return NextResponse.json({ error: "This match has already started." }, { status: 409 });
  }

  const saved = await prisma.userPick.upsert({
    where: { userId_fixtureId: { userId: session.user.id, fixtureId } },
    create: { userId: session.user.id, fixtureId, pick },
    update: { pick },
  });

  return NextResponse.json({ ok: true, pick: saved.pick });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({ code: z.string().trim().min(1).max(40) });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρος κωδικός." }, { status: 400 });
  }
  const code = parsed.data.code.toUpperCase();

  const promo = await prisma.promoCode.findUnique({ where: { code } });
  if (!promo) {
    return NextResponse.json({ error: "Δεν βρέθηκε αυτός ο κωδικός." }, { status: 404 });
  }
  if (promo.redeemedByUserId) {
    return NextResponse.json({ error: "Ο κωδικός έχει ήδη χρησιμοποιηθεί." }, { status: 409 });
  }

  const redeemedAt = new Date();
  const currentPeriodEnd =
    promo.durationDays != null ? new Date(redeemedAt.getTime() + promo.durationDays * 86400000) : null;

  await prisma.$transaction([
    prisma.promoCode.update({
      where: { code },
      data: { redeemedByUserId: session.user.id, redeemedAt },
    }),
    prisma.subscription.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, plan: "PRO", status: "active", currentPeriodEnd },
      update: { plan: "PRO", status: "active", currentPeriodEnd },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

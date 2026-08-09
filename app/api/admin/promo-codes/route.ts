import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `SKORAMA-${s}`;
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return isAdminEmail(session?.user?.email);
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const codes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { redeemedBy: { select: { email: true } } },
  });
  return NextResponse.json({ codes });
}

// Body: { count, durationDays } — durationDays null/omitted means lifetime.
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { count, durationDays } = await req.json();
  const n = Math.min(Math.max(Number(count) || 1, 1), 50);
  const days = durationDays == null ? null : Math.max(1, Number(durationDays));
  const codes = Array.from({ length: n }, randomCode);
  await prisma.promoCode.createMany({ data: codes.map((code) => ({ code, durationDays: days })), skipDuplicates: true });
  return NextResponse.json({ ok: true, codes });
}

// Body: { code, durationDays } — extends/reduces the code's duration. If
// already redeemed, also recomputes the live Subscription's
// currentPeriodEnd from redeemedAt so the change actually takes effect.
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, durationDays } = await req.json();
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });
  const days = durationDays == null ? null : Math.max(1, Number(durationDays));

  const promo = await prisma.promoCode.update({ where: { code }, data: { durationDays: days } });

  if (promo.redeemedByUserId && promo.redeemedAt) {
    const currentPeriodEnd = days != null ? new Date(promo.redeemedAt.getTime() + days * 86400000) : null;
    await prisma.subscription.update({
      where: { userId: promo.redeemedByUserId },
      data: { currentPeriodEnd, status: "active", plan: "PRO" },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });
  await prisma.promoCode.delete({ where: { code } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

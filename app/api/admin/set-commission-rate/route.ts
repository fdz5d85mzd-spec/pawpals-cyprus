import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { affiliateId, commissionPercent } = await req.json();
  const pct = Number(commissionPercent);
  if (!affiliateId || !Number.isFinite(pct) || pct < 0 || pct > 100) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await prisma.affiliate.update({ where: { id: affiliateId }, data: { commissionPercent: Math.round(pct) } });
  return NextResponse.json({ ok: true });
}

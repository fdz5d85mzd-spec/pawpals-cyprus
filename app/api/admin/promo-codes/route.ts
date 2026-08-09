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
    take: 30,
    include: { redeemedBy: { select: { email: true } } },
  });
  return NextResponse.json({ codes });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { count } = await req.json();
  const n = Math.min(Math.max(Number(count) || 1, 1), 50);
  const codes = Array.from({ length: n }, randomCode);
  await prisma.promoCode.createMany({ data: codes.map((code) => ({ code })), skipDuplicates: true });
  return NextResponse.json({ ok: true, codes });
}

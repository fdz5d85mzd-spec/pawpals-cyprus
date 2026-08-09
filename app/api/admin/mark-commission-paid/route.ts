import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { affiliateId } = await req.json();
  if (!affiliateId) return NextResponse.json({ error: "Missing affiliateId" }, { status: 400 });

  await prisma.affiliateCommission.updateMany({
    where: { affiliateId, status: "PENDING" },
    data: { status: "PAID" },
  });
  return NextResponse.json({ ok: true });
}

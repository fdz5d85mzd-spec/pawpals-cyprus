import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ isAffiliate: false });

  const affiliate = await prisma.affiliate.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ isAffiliate: Boolean(affiliate) });
}

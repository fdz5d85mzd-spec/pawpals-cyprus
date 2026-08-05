import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Anonymous — fired from AffiliateTracker on any page load that carries
// ?aff=CODE, purely to count clicks for the affiliate's dashboard stats.
export async function POST(req: NextRequest) {
  const { code } = await req.json().catch(() => ({}));
  if (typeof code !== "string" || !code) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const affiliate = await prisma.affiliate.findUnique({ where: { code } });
  if (!affiliate) return NextResponse.json({ ok: false }, { status: 404 });

  await prisma.affiliateClick.create({ data: { affiliateId: affiliate.id } });
  return NextResponse.json({ ok: true });
}

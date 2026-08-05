import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateAffiliateCode, DEFAULT_COMMISSION_PERCENT } from "@/lib/affiliate";

// Opt-in: any logged-in user can become a partner. Idempotent — if they
// already have an Affiliate row, just return it instead of erroring.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const existing = await prisma.affiliate.findUnique({ where: { userId: session.user.id } });
  if (existing) return NextResponse.json({ ok: true, code: existing.code });

  let affiliate;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      affiliate = await prisma.affiliate.create({
        data: {
          userId: session.user.id,
          code: generateAffiliateCode(),
          commissionPercent: DEFAULT_COMMISSION_PERCENT,
        },
      });
      break;
    } catch (err) {
      if (attempt === 2) throw err;
    }
  }

  return NextResponse.json({ ok: true, code: affiliate!.code });
}

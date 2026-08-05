import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { EARLY_BIRD_LIMIT } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  const count = await prisma.subscription.count({ where: { plan: "PRO", status: "active" } });
  const earlyBirdSpotsLeft = Math.max(0, EARLY_BIRD_LIMIT - count);
  return NextResponse.json({ count, earlyBirdSpotsLeft });
}

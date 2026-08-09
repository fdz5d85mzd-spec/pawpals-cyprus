import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Public (any visitor, including signed-out): which positions in a slot are
// currently claimed by an in-flight submission (paid-but-not-approved, or
// not-yet-paid), and whether that claim belongs to the viewer. Fetched
// client-side by AdSlotBoxes so the homepage itself can stay ISR-cached
// instead of going fully dynamic just for this.
export async function GET(req: NextRequest) {
  const slotKey = req.nextUrl.searchParams.get("slotKey");
  if (!slotKey) return NextResponse.json({ error: "Missing slotKey" }, { status: 400 });

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const submissions = await prisma.adSubmission.findMany({
    where: { slotKey, status: { in: ["AWAITING_PAYMENT", "PENDING_APPROVAL"] } },
    select: { position: true, status: true, advertiserUserId: true },
  });

  const claims = submissions.map((s) => ({
    position: s.position,
    status: s.status,
    mine: !!userId && s.advertiserUserId === userId,
  }));

  return NextResponse.json({ claims });
}

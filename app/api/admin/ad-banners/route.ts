import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) return null;
  return session;
}

// Upserts one box (slotKey + position). Body: { slotKey, position, imageUrl, linkUrl }.
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slotKey, position, imageUrl, linkUrl } = await req.json();
  if (!slotKey || typeof position !== "number" || !imageUrl || !linkUrl) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const banner = await prisma.adBanner.upsert({
    where: { slotKey_position: { slotKey, position } },
    create: { slotKey, position, imageUrl, linkUrl },
    update: { imageUrl, linkUrl },
  });

  return NextResponse.json({ ok: true, banner });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slotKey, position } = await req.json();
  if (!slotKey || typeof position !== "number") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await prisma.adBanner.deleteMany({ where: { slotKey, position } });
  return NextResponse.json({ ok: true });
}

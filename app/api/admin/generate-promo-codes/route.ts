import { NextRequest, NextResponse } from "next/server";
import { cronAuthError } from "@/lib/cron-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `SKORAMA-${s}`;
}

// Gated the same way as the cron endpoints (Bearer or ?secret= CRON_SECRET) —
// not a real admin auth system, just enough to keep this from being public.
export async function GET(req: NextRequest) {
  const authError = cronAuthError(req);
  if (authError) return authError;

  const count = Number(req.nextUrl.searchParams.get("count") ?? "10");
  const codes: string[] = [];
  for (let i = 0; i < count; i++) codes.push(randomCode());

  await prisma.promoCode.createMany({ data: codes.map((code) => ({ code })), skipDuplicates: true });

  return NextResponse.json({ ok: true, codes });
}

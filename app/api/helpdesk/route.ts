import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().email(),
  subject: z.string().trim().min(1).max(150),
  body: z.string().trim().min(5).max(2000),
});

// No auth required — anyone should be able to reach support. Submissions
// are stored (no email delivery configured yet); check the HelpdeskMessage
// table in Supabase, or wire up an email provider like Resend later.
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.helpdeskMessage.create({ data: parsed.data });

  return NextResponse.json({ ok: true });
}

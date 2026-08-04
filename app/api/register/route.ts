import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  dateOfBirth: z.string().min(1, "Συμπλήρωσε την ημερομηνία γέννησής σου."),
  acceptTerms: z.boolean().refine((v) => v === true, "Πρέπει να αποδεχτείς τους όρους χρήσης."),
  emailUpdatesOptIn: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, email, password, dateOfBirth, emailUpdatesOptIn } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      dateOfBirth: new Date(dateOfBirth),
      acceptedTermsAt: new Date(),
      emailUpdatesOptIn,
      subscription: { create: { plan: "FREE", status: "inactive" } },
    },
  });

  return NextResponse.json({ ok: true, userId: user.id });
}

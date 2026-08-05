import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateReferralCode } from "@/lib/referral";
import { AFFILIATE_COOKIE } from "@/lib/affiliate";

const TRIAL_HOURS = 24;

const schema = z.object({
  name: z.string().min(1).max(80),
  username: z
    .string()
    .min(3, "Το username πρέπει να έχει τουλάχιστον 3 χαρακτήρες.")
    .max(24, "Το username δεν μπορεί να ξεπερνά τους 24 χαρακτήρες.")
    .regex(/^[a-zA-Z0-9_]+$/, "Μόνο λατινικά γράμματα, αριθμοί και κάτω παύλα (_)."),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  dateOfBirth: z.string().min(1, "Συμπλήρωσε την ημερομηνία γέννησής σου."),
  acceptTerms: z.boolean().refine((v) => v === true, "Πρέπει να αποδεχτείς τους όρους χρήσης."),
  emailUpdatesOptIn: z.boolean().optional().default(false),
  ref: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, username, email, password, dateOfBirth, emailUpdatesOptIn, ref } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) {
    const field = existing.email === email ? "email" : "username";
    return NextResponse.json(
      { error: field === "email" ? "An account with that email already exists." : "Το username χρησιμοποιείται ήδη." },
      { status: 409 }
    );
  }

  const referrer = ref ? await prisma.user.findUnique({ where: { referralCode: ref } }) : null;

  // Affiliate attribution rides in on a cookie (set by AffiliateTracker when
  // the visitor first landed with ?aff=CODE) rather than a form field, so it
  // survives them browsing around before actually signing up.
  const affCode = req.cookies.get(AFFILIATE_COOKIE)?.value;
  const affiliate = affCode ? await prisma.affiliate.findUnique({ where: { code: affCode } }) : null;

  const passwordHash = await bcrypt.hash(password, 12);

  // Retry on the (astronomically unlikely) referralCode collision rather
  // than letting the unique constraint 500 the whole signup.
  let user;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      user = await prisma.user.create({
        data: {
          name,
          username,
          email,
          passwordHash,
          dateOfBirth: new Date(dateOfBirth),
          acceptedTermsAt: new Date(),
          emailUpdatesOptIn,
          trialEndsAt: new Date(Date.now() + TRIAL_HOURS * 60 * 60 * 1000),
          referralCode: generateReferralCode(),
          referredById: referrer?.id,
          referredByAffiliateId: affiliate?.id,
          subscription: { create: { plan: "FREE", status: "inactive" } },
        },
      });
      break;
    } catch (err) {
      if (attempt === 2) throw err;
    }
  }

  return NextResponse.json({ ok: true, userId: user!.id, trialHours: TRIAL_HOURS });
}

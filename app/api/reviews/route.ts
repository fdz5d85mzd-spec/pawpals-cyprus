import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const review = await prisma.siteReview.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, rating: parsed.data.rating, body: parsed.data.body },
    update: { rating: parsed.data.rating, body: parsed.data.body },
    include: { user: true },
  });

  return NextResponse.json({
    id: review.id,
    rating: review.rating,
    body: review.body,
    createdAt: review.createdAt,
    userName: review.user.name ?? review.user.email,
  });
}

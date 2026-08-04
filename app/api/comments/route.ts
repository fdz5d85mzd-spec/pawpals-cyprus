import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  fixtureId: z.number().int(),
  body: z.string().trim().min(1).max(1000),
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

  const comment = await prisma.matchComment.create({
    data: {
      fixtureId: parsed.data.fixtureId,
      userId: session.user.id,
      body: parsed.data.body,
    },
    include: { user: true },
  });

  return NextResponse.json({
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt,
    userName: comment.user.name ?? comment.user.email,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) return null;
  return session;
}

// Approve or reject a self-serve ad submission that already went through
// payment (status PENDING_APPROVAL). Body: { id, action: "approve" | "reject", reason? }.
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action, reason } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const submission = await prisma.adSubmission.findUnique({ where: { id } });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (submission.status !== "PENDING_APPROVAL") {
    return NextResponse.json({ error: "Only submissions awaiting approval can be reviewed." }, { status: 409 });
  }

  if (action === "approve") {
    await prisma.$transaction([
      prisma.adBanner.upsert({
        where: { slotKey_position: { slotKey: submission.slotKey, position: submission.position } },
        create: {
          slotKey: submission.slotKey,
          position: submission.position,
          imageUrl: submission.imageUrl,
          linkUrl: submission.linkUrl,
          sourceSubmissionId: submission.id,
        },
        update: { imageUrl: submission.imageUrl, linkUrl: submission.linkUrl, sourceSubmissionId: submission.id },
      }),
      prisma.adSubmission.update({ where: { id }, data: { status: "APPROVED" } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  // Reject: cancel the Stripe subscription immediately so no renewal is ever
  // charged. The first payment they already made isn't auto-refunded here —
  // that's a manual call in the Stripe dashboard if the admin wants one.
  if (submission.stripeSubscriptionId) {
    await stripe.subscriptions.cancel(submission.stripeSubscriptionId).catch(() => {});
  }
  await prisma.adSubmission.update({
    where: { id },
    data: { status: "REJECTED", rejectionReason: typeof reason === "string" ? reason : null },
  });
  return NextResponse.json({ ok: true });
}

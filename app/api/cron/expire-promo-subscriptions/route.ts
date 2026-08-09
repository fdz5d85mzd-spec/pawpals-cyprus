import { NextRequest, NextResponse } from "next/server";
import { cronAuthError } from "@/lib/cron-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Runs daily. A promo-code redemption sets Subscription.currentPeriodEnd
// but nothing else ever re-checks it — the PRO gate in lib/auth.ts only
// looks at `status === "active"`. This is what actually turns that expiry
// date into losing access. Scoped to stripeSubscriptionId: null so a real
// paying customer (managed entirely by the Stripe webhook) is never
// touched here even if this cron misfires.
export async function GET(req: NextRequest) {
  const authError = cronAuthError(req);
  if (authError) return authError;

  const result = await prisma.subscription.updateMany({
    where: {
      plan: "PRO",
      status: "active",
      stripeSubscriptionId: null,
      currentPeriodEnd: { lt: new Date() },
    },
    data: { plan: "FREE", status: "inactive" },
  });

  return NextResponse.json({ ok: true, expired: result.count });
}

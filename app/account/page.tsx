import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ManageBillingButton } from "@/components/ManageBillingButton";
import { PromoRedeemForm } from "@/components/PromoRedeemForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const subscription = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
  const isPro = subscription?.plan === "PRO" && subscription.status === "active";

  return (
    <div className="max-w-xs mx-auto px-5 py-16">
      <h1 className="font-display text-3xl mb-8 font-extrabold text-ink tracking-tight">Ο λογαριασμός μου</h1>
      <div className="card p-5 mb-4">
        <div className="text-xs text-muted mb-1">Email</div>
        <div className="text-sm text-ink mb-4">{session.user.email}</div>
        <div className="text-xs text-muted mb-1">Πλάνο</div>
        <div className="text-sm font-bold text-lime">{subscription?.plan ?? "FREE"}</div>
      </div>
      {subscription?.stripeCustomerId && (
        <div className="mb-4">
          <ManageBillingButton />
        </div>
      )}
      {!isPro && (
        <div className="card p-5">
          <div className="text-xs text-muted mb-2">Έχεις promo code;</div>
          <PromoRedeemForm />
        </div>
      )}
    </div>
  );
}

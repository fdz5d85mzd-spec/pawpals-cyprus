import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ManageBillingButton } from "@/components/ManageBillingButton";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const subscription = await prisma.subscription.findUnique({ where: { userId: session.user.id } });

  return (
    <div className="max-w-xs mx-auto px-5 py-12">
      <h1 className="font-display text-2xl mb-6 font-bold text-ink">Ο λογαριασμός μου</h1>
      <div className="rounded-2xl p-5 bg-surface border border-border mb-4">
        <div className="text-xs text-muted mb-1">Email</div>
        <div className="text-sm text-ink mb-4">{session.user.email}</div>
        <div className="text-xs text-muted mb-1">Πλάνο</div>
        <div className="text-sm font-bold text-lime">{subscription?.plan ?? "FREE"}</div>
      </div>
      {subscription?.stripeCustomerId && <ManageBillingButton />}
    </div>
  );
}

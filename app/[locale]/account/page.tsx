import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { ManageBillingButton } from "@/components/ManageBillingButton";
import { PromoRedeemForm } from "@/components/PromoRedeemForm";
import { ReferralCard } from "@/components/ReferralCard";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { generateReferralCode } from "@/lib/referral";
import { getBadges } from "@/lib/badges";
import { BadgeRow } from "@/components/BadgeRow";
import { PersonalizationPreferences } from "@/components/PersonalizationPreferences";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const t = await getTranslations("leaderboard");

  const [subscription, user, totalPicks, hitPicks, leagues] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, include: { rewardsEarned: true } }),
    prisma.userPick.count({ where: { userId: session.user.id, hit: { not: null } } }),
    prisma.userPick.count({ where: { userId: session.user.id, hit: true } }),
    prisma.league.findMany({ select: { name: true }, distinct: ["name"], orderBy: { name: "asc" }, take: 20 }),
  ]);
  const isPro = subscription?.plan === "PRO" && subscription.status === "active";
  const isTrialing = !!session.user.trialEndsAt;

  // Accounts created before the referral program existed won't have a code
  // yet — mint one on first visit rather than backfilling every row.
  let referralCode = user?.referralCode;
  if (!referralCode) {
    referralCode = generateReferralCode();
    await prisma.user.update({ where: { id: session.user.id }, data: { referralCode } });
  }
  const appliedRewards = user?.rewardsEarned.filter((r) => r.appliedAt).length ?? 0;
  const pendingRewards = user?.rewardsEarned.filter((r) => !r.appliedAt).length ?? 0;
  const badges = user ? getBadges({ totalPicks, hitPicks, memberSince: user.createdAt }) : [];

  return (
    <div className="relative overflow-hidden flex items-center justify-center px-5 py-16 min-h-[calc(100vh-3.5rem)]">
      <div className="absolute -top-32 -right-24 w-96 h-96 bg-lime" style={{ transform: "rotate(24deg)" }} />
      <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-lime/20" style={{ transform: "rotate(24deg)" }} />
      <div className="relative w-full max-w-md">
      <h1 className="font-display text-3xl mb-8 font-extrabold text-ink tracking-tight">Ο λογαριασμός μου</h1>
      <div className="card p-5 mb-4">
        <div className="text-xs text-muted mb-1">Email</div>
        <div className="text-sm text-ink mb-4">{session.user.email}</div>
        <div className="text-xs text-muted mb-1">Πλάνο</div>
        <div className="text-sm font-bold text-lime">
          {subscription?.plan ?? "FREE"}
          {isTrialing && <span className="text-ink font-normal text-xs"> (δωρεάν trial)</span>}
        </div>
      </div>
      {subscription?.stripeCustomerId && (
        <div className="mb-4">
          <ManageBillingButton />
        </div>
      )}
      <div className="mb-4">
        <PushNotificationToggle />
      </div>
      <div className="mb-4">
        <PersonalizationPreferences leagues={leagues.map((league) => league.name)} initialEmailOptIn={user?.emailUpdatesOptIn ?? false} />
      </div>
      {!isPro && (
        <div className="card p-5 mb-4">
          <div className="text-xs text-muted mb-2">Έχεις promo code;</div>
          <PromoRedeemForm />
        </div>
      )}
      {referralCode && (
        <ReferralCard referralCode={referralCode} appliedRewards={appliedRewards} pendingRewards={pendingRewards} />
      )}
      <div className="card p-5 mt-4">
        <div className="text-xs text-muted mb-2">{t("myStats")}</div>
        {totalPicks > 0 ? (
          <div className="text-sm text-lime font-bold mb-2">
            {t("myAccuracy", { hits: hitPicks, total: totalPicks, pct: Math.round((hitPicks / totalPicks) * 100) })}
          </div>
        ) : (
          <div className="text-xs text-dim mb-2">{t("noPicksYet")}</div>
        )}
        <Link href="/leaderboard" className="text-[11px] text-lime font-bold">
          {t("viewAll")}
        </Link>
      </div>
      {badges.length > 0 && (
        <div className="card p-5 mt-4">
          <div className="text-xs text-muted mb-3">Επιτεύγματα</div>
          <BadgeRow badges={badges} />
        </div>
      )}
      </div>
    </div>
  );
}

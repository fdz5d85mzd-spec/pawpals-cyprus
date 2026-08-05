import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { Handshake } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AffiliateActivateButton } from "@/components/AffiliateActivateButton";
import { AffiliateLinkCard } from "@/components/AffiliateLinkCard";

export const dynamic = "force-dynamic";

const MONTHLY_PRICE_EUR = 6.99;

function formatEur(cents: number): string {
  return (cents / 100).toLocaleString("el-GR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "€";
}

export default async function AffiliatePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const t = await getTranslations("affiliate");

  const affiliate = await prisma.affiliate.findUnique({
    where: { userId: session.user.id },
    include: {
      commissions: { orderBy: { createdAt: "desc" }, take: 20, include: { referredUser: true } },
      _count: { select: { clicks: true, referredSignups: true } },
    },
  });

  if (!affiliate) {
    const exampleEarning = (MONTHLY_PRICE_EUR * 20) / 100;
    return (
      <div className="max-w-2xl mx-auto px-5 pt-8 pb-16">
        <div className="flex items-center gap-2 mb-2 animate-fade-up">
          <Handshake size={16} className="text-lime" />
          <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-dim">{t("kicker")}</span>
        </div>
        <h1 className="font-display text-4xl mb-3 font-extrabold text-ink tracking-tight animate-fade-up" style={{ animationDelay: "60ms" }}>
          {t("title")}
        </h1>
        <p className="text-sm text-muted mb-2 animate-fade-up" style={{ animationDelay: "120ms" }}>
          {t("subtitleIntro", { percent: 20 })}
        </p>
        <p className="text-xs text-lime font-bold mb-8">
          {t("mathExample", {
            price: `${MONTHLY_PRICE_EUR.toFixed(2)}€`,
            earning: `${(exampleEarning * 10).toFixed(2)}€`,
          })}
        </p>
        <AffiliateActivateButton label={t("activateCta")} />
      </div>
    );
  }

  const payingCustomers = new Set(affiliate.commissions.map((c) => c.referredUserId)).size;
  const totalEarnedCents = affiliate.commissions.reduce((s, c) => s + c.amountCents, 0);
  const pendingCents = affiliate.commissions.filter((c) => c.status === "PENDING").reduce((s, c) => s + c.amountCents, 0);
  const paidCents = affiliate.commissions.filter((c) => c.status === "PAID").reduce((s, c) => s + c.amountCents, 0);

  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-16">
      <div className="flex items-center gap-2 mb-2 animate-fade-up">
        <Handshake size={16} className="text-lime" />
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-dim">{t("kicker")}</span>
      </div>
      <h1 className="font-display text-4xl mb-2 font-extrabold text-ink tracking-tight animate-fade-up" style={{ animationDelay: "60ms" }}>
        {t("title")}
      </h1>
      <p className="text-sm text-muted mb-8 animate-fade-up" style={{ animationDelay: "120ms" }}>
        {t("subtitleIntro", { percent: affiliate.commissionPercent })}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <div className="card p-3.5">
          <div className="text-[9px] uppercase tracking-wide font-mono mb-1.5 text-dim">{t("clicks")}</div>
          <div className="text-lg font-bold font-mono text-ink">{affiliate._count.clicks}</div>
        </div>
        <div className="card p-3.5">
          <div className="text-[9px] uppercase tracking-wide font-mono mb-1.5 text-dim">{t("signups")}</div>
          <div className="text-lg font-bold font-mono text-ink">{affiliate._count.referredSignups}</div>
        </div>
        <div className="card p-3.5">
          <div className="text-[9px] uppercase tracking-wide font-mono mb-1.5 text-dim">{t("payingCustomers")}</div>
          <div className="text-lg font-bold font-mono text-lime">{payingCustomers}</div>
        </div>
        <div className="card p-3.5">
          <div className="text-[9px] uppercase tracking-wide font-mono mb-1.5 text-dim">{t("commissionRate")}</div>
          <div className="text-lg font-bold font-mono text-ink">{affiliate.commissionPercent}%</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="card p-3.5 border-lime/40">
          <div className="text-[9px] uppercase tracking-wide font-mono mb-1.5 text-dim">{t("totalEarned")}</div>
          <div className="text-base font-bold font-mono text-lime">{formatEur(totalEarnedCents)}</div>
        </div>
        <div className="card p-3.5">
          <div className="text-[9px] uppercase tracking-wide font-mono mb-1.5 text-dim">{t("pendingBalance")}</div>
          <div className="text-base font-bold font-mono text-amber">{formatEur(pendingCents)}</div>
        </div>
        <div className="card p-3.5">
          <div className="text-[9px] uppercase tracking-wide font-mono mb-1.5 text-dim">{t("paidOut")}</div>
          <div className="text-base font-bold font-mono text-muted">{formatEur(paidCents)}</div>
        </div>
      </div>

      <div className="mb-6">
        <AffiliateLinkCard code={affiliate.code} />
      </div>

      <div className="text-xs text-muted mb-2">{t("recentCommissions")}</div>
      {affiliate.commissions.length === 0 ? (
        <div className="card p-6 text-center text-xs text-dim mb-4">{t("noCommissionsYet")}</div>
      ) : (
        <div className="card overflow-x-auto mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[9px] uppercase tracking-wide font-mono text-dim border-b border-border/60">
                <th className="text-left py-2.5 px-3">{t("colDate")}</th>
                <th className="text-left py-2.5 px-3">{t("colPlan")}</th>
                <th className="text-right py-2.5 px-3">{t("colAmount")}</th>
                <th className="text-right py-2.5 px-3">{t("colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {affiliate.commissions.map((c) => (
                <tr key={c.id} className="border-b border-border/40 last:border-0">
                  <td className="py-2.5 px-3 font-mono text-dim">{c.createdAt.toLocaleDateString("el-GR")}</td>
                  <td className="py-2.5 px-3 text-ink">{c.plan}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-lime">{formatEur(c.amountCents)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold font-mono ${
                        c.status === "PAID" ? "bg-lime/15 text-lime" : "bg-amber/15 text-amber"
                      }`}
                    >
                      {c.status === "PAID" ? t("statusPaid") : t("statusPending")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-dim leading-relaxed">{t("payoutNote")}</p>
    </div>
  );
}

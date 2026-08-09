import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { LayoutDashboard, Users, Handshake, MessageSquareWarning, Star, Lightbulb, Wallet, Ticket } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { getOverallAccuracy } from "@/lib/accuracy";
import { getRevenueSummary } from "@/lib/stripe-revenue";
import { Link } from "@/i18n/navigation";
import { PromoCodeManager } from "@/components/admin/PromoCodeManager";
import { MarkPaidButton } from "@/components/admin/MarkPaidButton";
import { CommissionRateEditor } from "@/components/admin/CommissionRateEditor";

export const dynamic = "force-dynamic";

function formatEur(cents: number): string {
  return (cents / 100).toLocaleString("el-GR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "€";
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`card p-3.5 ${accent ? "border-lime/40" : ""}`}>
      <div className="text-[9px] uppercase tracking-wide font-mono mb-1.5 text-dim">{label}</div>
      <div className={`text-lg font-bold font-mono ${accent ? "text-lime" : "text-ink"}`}>{value}</div>
    </div>
  );
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!isAdminEmail(session.user.email)) redirect("/");

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newToday,
    newThisWeek,
    proActive,
    trialing,
    affiliatesCount,
    pendingAgg,
    paidAgg,
    topAffiliates,
    accuracy,
    openSuggestions,
    unresolvedHelp,
    reviewAgg,
    revenue,
    promoCodes,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.subscription.count({ where: { plan: "PRO", status: "active" } }),
    prisma.user.count({ where: { trialEndsAt: { gt: now } } }),
    prisma.affiliate.count(),
    prisma.affiliateCommission.aggregate({ _sum: { amountCents: true }, where: { status: "PENDING" } }),
    prisma.affiliateCommission.aggregate({ _sum: { amountCents: true }, where: { status: "PAID" } }),
    prisma.affiliate.findMany({
      include: { user: true, commissions: { select: { amountCents: true, status: true } } },
    }),
    getOverallAccuracy(),
    prisma.suggestion.count({ where: { status: "OPEN" } }),
    prisma.helpdeskMessage.count({ where: { resolved: false } }),
    prisma.siteReview.aggregate({ _avg: { rating: true }, _count: true }),
    getRevenueSummary(),
    prisma.promoCode.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { redeemedBy: { select: { email: true } } } }),
  ]);

  const rankedAffiliates = topAffiliates
    .map((a) => ({
      id: a.id,
      email: a.user.email,
      code: a.code,
      commissionPercent: a.commissionPercent,
      totalCents: a.commissions.reduce((s, c) => s + c.amountCents, 0),
      pendingCents: a.commissions.filter((c) => c.status === "PENDING").reduce((s, c) => s + c.amountCents, 0),
    }))
    .sort((a, b) => b.totalCents - a.totalCents)
    .slice(0, 5);

  const adminEmails = (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const halfMonthCents = Math.round((revenue.monthCents ?? 0) / 2);

  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-16">
      <div className="flex items-center gap-2 mb-2">
        <LayoutDashboard size={16} className="text-lime" />
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-dim">Master Dashboard</span>
      </div>
      <h1 className="font-display text-4xl mb-8 font-extrabold text-ink tracking-tight">Επισκόπηση Skorama</h1>

      <div className="flex items-center gap-2 mb-3">
        <Wallet size={13} className="text-dim" />
        <span className="text-xs font-bold text-muted uppercase tracking-wide">Έσοδα (live από Stripe)</span>
      </div>
      {revenue.error ? (
        <div className="card p-4 text-xs text-dim mb-6">Μη διαθέσιμο αυτή τη στιγμή ({revenue.error}). Δες το Stripe Dashboard.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <StatCard label="MRR (εκτίμηση)" value={formatEur(revenue.mrrCents)} accent />
          <StatCard label="Ενεργές συνδρομές" value={revenue.activeSubscriptions} />
          <StatCard label="Έσοδα σήμερα" value={formatEur(revenue.todayCents)} />
          <StatCard label="Έσοδα μήνα" value={formatEur(revenue.monthCents)} />
        </div>
      )}

      {adminEmails.length === 2 && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={13} className="text-dim" />
            <span className="text-xs font-bold text-muted uppercase tracking-wide">Μοιρασμα κερδών (50/50, βάσει εσόδων μήνα)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-6">
            <StatCard label={adminEmails[0]} value={formatEur(halfMonthCents)} accent />
            <StatCard label={adminEmails[1]} value={formatEur(halfMonthCents)} accent />
          </div>
        </>
      )}

      <div className="flex items-center gap-2 mb-3">
        <Users size={13} className="text-dim" />
        <span className="text-xs font-bold text-muted uppercase tracking-wide">Χρήστες & Συνδρομές</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        <StatCard label="Σύνολο χρηστών" value={totalUsers} />
        <StatCard label="Νέες εγγραφές σήμερα" value={newToday} />
        <StatCard label="Νέες εγγραφές 7ημ." value={newThisWeek} />
        <StatCard label="Ενεργοί Pro" value={proActive} accent />
        <StatCard label="Σε δωρεάν trial" value={trialing} />
        <StatCard label="Μέσος όρος reviews" value={reviewAgg._count > 0 ? `${(reviewAgg._avg.rating ?? 0).toFixed(1)}★ (${reviewAgg._count})` : "—"} />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Handshake size={13} className="text-dim" />
        <span className="text-xs font-bold text-muted uppercase tracking-wide">Πρόγραμμα Συνεργατών</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatCard label="Συνεργάτες" value={affiliatesCount} />
        <StatCard label="Προς πληρωμή" value={formatEur(pendingAgg._sum.amountCents ?? 0)} />
        <StatCard label="Ήδη πληρωμένα" value={formatEur(paidAgg._sum.amountCents ?? 0)} />
      </div>
      {rankedAffiliates.length > 0 && (
        <div className="card overflow-x-auto mb-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[9px] uppercase tracking-wide font-mono text-dim border-b border-border/60">
                <th className="text-left py-2.5 px-3">Συνεργάτης</th>
                <th className="text-right py-2.5 px-3">Ποσοστό</th>
                <th className="text-right py-2.5 px-3">Σύνολο</th>
                <th className="text-right py-2.5 px-3">Προς πληρωμή</th>
                <th className="text-right py-2.5 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {rankedAffiliates.map((a) => (
                <tr key={a.code} className="border-b border-border/40 last:border-0">
                  <td className="py-2.5 px-3 text-ink">{a.email}</td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    <CommissionRateEditor affiliateId={a.id} initialPercent={a.commissionPercent} />
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-lime">{formatEur(a.totalCents)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber">{formatEur(a.pendingCents)}</td>
                  <td className="py-2.5 px-3 text-right">{a.pendingCents > 0 && <MarkPaidButton affiliateId={a.id} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <Star size={13} className="text-dim" />
        <span className="text-xs font-bold text-muted uppercase tracking-wide">Ακρίβεια μοντέλου</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-6">
        <StatCard label="Ακρίβεια" value={`${accuracy.accuracy}%`} accent />
        <StatCard label="Σωστά" value={accuracy.correct} />
        <StatCard label="Σύνολο κριθέντων" value={accuracy.total} />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <MessageSquareWarning size={13} className="text-dim" />
        <span className="text-xs font-bold text-muted uppercase tracking-wide">Χρειάζονται προσοχή</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <StatCard label="Άλυτα help tickets" value={unresolvedHelp} />
        <StatCard label="Νέες εισηγήσεις" value={openSuggestions} />
      </div>
      <div className="flex gap-3 text-[11px] text-dim mb-6">
        <Link href="/help" className="underline hover:text-ink">Δες help tickets στη σελίδα Support</Link>
        <span>·</span>
        <Link href="/suggestions" className="underline hover:text-ink">Δες εισηγήσεις</Link>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Ticket size={13} className="text-dim" />
        <span className="text-xs font-bold text-muted uppercase tracking-wide">Promo Codes</span>
      </div>
      <div className="mb-6">
        <PromoCodeManager
          initialCodes={promoCodes.map((c) => ({
            code: c.code,
            durationDays: c.durationDays,
            redeemedAt: c.redeemedAt?.toISOString() ?? null,
            redeemedBy: c.redeemedBy,
          }))}
        />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Lightbulb size={13} className="text-dim" />
        <span className="text-xs font-bold text-muted uppercase tracking-wide">Σημείωση</span>
      </div>
      <p className="text-[11px] text-dim leading-relaxed">
        Τα έσοδα πάνω είναι εκτίμηση σε πραγματικό χρόνο από το Stripe (MRR υπολογισμένο από ενεργές συνδρομές, έσοδα σήμερα/μήνα από επιτυχημένες χρεώσεις). Για πλήρη λογιστική εικόνα (refunds, chargebacks, φόροι) δες το{" "}
        <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="text-lime underline">
          Stripe Dashboard
        </a>
        .
      </p>
    </div>
  );
}

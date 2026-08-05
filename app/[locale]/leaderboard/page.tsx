import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { Trophy, Flame } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStreaks } from "@/lib/streak";

const MIN_PICKS = 5;

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const t = await getTranslations("leaderboard");
  const session = await getServerSession(authOptions);

  const picks = await prisma.userPick.findMany({
    where: { hit: { not: null } },
    include: { user: true },
  });

  const byUser = new Map<string, { name: string; hits: number; total: number }>();
  for (const p of picks) {
    const entry = byUser.get(p.userId) ?? { name: p.user.username ?? p.user.name ?? "—", hits: 0, total: 0 };
    entry.total++;
    if (p.hit) entry.hits++;
    byUser.set(p.userId, entry);
  }

  const rows = Array.from(byUser.entries())
    .map(([userId, e]) => ({ userId, ...e, pct: Math.round((e.hits / e.total) * 100) }))
    .filter((r) => r.total >= MIN_PICKS)
    .sort((a, b) => b.pct - a.pct || b.total - a.total)
    .slice(0, 50);

  const mine = session?.user?.id ? byUser.get(session.user.id) : undefined;
  const streaks = await getStreaks(rows.map((r) => r.userId));

  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-16">
      <div className="flex items-center gap-2 mb-2 animate-fade-up">
        <Trophy size={16} className="text-lime" />
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-dim">{t("kicker")}</span>
      </div>
      <h1
        className="font-display text-4xl mb-2 font-extrabold text-ink tracking-tight animate-fade-up"
        style={{ animationDelay: "60ms" }}
      >
        {t("title")}
      </h1>
      <p className="text-sm text-muted mb-8 animate-fade-up" style={{ animationDelay: "120ms" }}>
        {t("subtitle", { min: MIN_PICKS })}
      </p>

      {mine && (
        <div className="card p-4 mb-6 border-lime/40">
          <div className="text-[10px] uppercase tracking-wide font-mono text-dim mb-1">{t("myStats")}</div>
          <div className="text-sm text-lime font-bold">
            {t("myAccuracy", { hits: mine.hits, total: mine.total, pct: Math.round((mine.hits / mine.total) * 100) })}
          </div>
        </div>
      )}
      {session?.user?.id && !mine && <div className="text-xs text-dim mb-6">{t("noPicksYet")}</div>}

      {rows.length === 0 ? (
        <div className="card p-6 text-center text-xs text-dim">{t("empty")}</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[9px] uppercase tracking-wide font-mono text-dim border-b border-border/60">
                <th className="text-left py-2.5 px-3">{t("rank")}</th>
                <th className="text-left py-2.5 px-3">{t("user")}</th>
                <th className="text-center py-2.5 px-3">{t("picks")}</th>
                <th className="text-right py-2.5 px-3">{t("accuracy")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.userId}
                  className={`border-b border-border/40 last:border-0 ${
                    r.userId === session?.user?.id ? "bg-lime/5" : ""
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono text-dim">{i + 1}</td>
                  <td className="py-2.5 px-3 text-ink font-medium">
                    <span className="flex items-center gap-1.5">
                      {r.name}
                      {(streaks.get(r.userId) ?? 0) >= 3 && (
                        <span className="flex items-center gap-0.5 text-[10px] font-mono font-bold text-amber">
                          <Flame size={11} className="fill-amber" />
                          {streaks.get(r.userId)}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-muted">
                    {r.hits}/{r.total}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-lime">{r.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

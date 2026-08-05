import Link from "next/link";
import { ListOrdered } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Eyebrow } from "@/components/predictor/ui";

export const dynamic = "force-dynamic";

export default async function StandingsPage({ searchParams }: { searchParams: Promise<{ league?: string }> }) {
  const { league: leagueParam } = await searchParams;
  const t = await getTranslations("standings");

  const leagues = await prisma.league.findMany({
    where: { standings: { some: {} } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto px-5 pt-8 pb-16">
      <div className="flex items-center gap-2 mb-2 animate-fade-up">
        <ListOrdered size={16} className="text-lime" />
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-dim">{t("kicker")}</span>
      </div>
      <h1 className="font-display text-4xl mb-6 font-extrabold text-ink tracking-tight animate-fade-up" style={{ animationDelay: "60ms" }}>
        {t("title")}
      </h1>

      {leagues.length === 0 ? (
        <div className="card p-6 text-center">
          <div className="text-sm text-ink font-medium mb-1">{t("empty")}</div>
          <div className="text-xs text-dim">{t("emptySub")}</div>
        </div>
      ) : (
        <StandingsBody leagues={leagues} activeLeagueId={leagueParam ? Number(leagueParam) : leagues[0].id} />
      )}
    </div>
  );
}

async function StandingsBody({
  leagues,
  activeLeagueId,
}: {
  leagues: { id: number; name: string }[];
  activeLeagueId: number;
}) {
  const t = await getTranslations("standings");
  const rows = await prisma.standing.findMany({
    where: { leagueId: activeLeagueId },
    include: { team: true },
    orderBy: { rank: "asc" },
  });

  return (
    <>
      <div className="flex gap-2 overflow-x-auto scrollbar-none mb-6 pb-1">
        {leagues.map((l) => (
          <Link
            key={l.id}
            href={`/standings?league=${l.id}`}
            className={`text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 whitespace-nowrap border-b-2 transition-colors ${
              l.id === activeLeagueId ? "text-lime border-lime" : "text-muted border-transparent hover:text-ink"
            }`}
          >
            {l.name}
          </Link>
        ))}
      </div>

      <Eyebrow>{t("tableTitle")}</Eyebrow>
      <div className="card overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[9px] uppercase tracking-wide font-mono text-dim border-b border-border/60">
              <th className="text-left py-2.5 px-3">#</th>
              <th className="text-left py-2.5 px-3">{t("colTeam")}</th>
              <th className="text-center py-2.5 px-2">{t("colPlayed")}</th>
              <th className="text-center py-2.5 px-2">{t("colWin")}</th>
              <th className="text-center py-2.5 px-2">{t("colDraw")}</th>
              <th className="text-center py-2.5 px-2">{t("colLose")}</th>
              <th className="text-center py-2.5 px-2">{t("colGoals")}</th>
              <th className="text-center py-2.5 px-3">{t("colPoints")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-surface2 transition-colors">
                <td className="py-2.5 px-3 font-mono text-dim">{r.rank}</td>
                <td className="py-2.5 px-3">
                  <Link href={`/team/${r.teamId}`} className="text-ink font-medium hover:text-lime transition-colors">
                    {r.team.name}
                  </Link>
                </td>
                <td className="text-center py-2.5 px-2 font-mono text-muted">{r.played}</td>
                <td className="text-center py-2.5 px-2 font-mono text-muted">{r.win}</td>
                <td className="text-center py-2.5 px-2 font-mono text-muted">{r.draw}</td>
                <td className="text-center py-2.5 px-2 font-mono text-muted">{r.lose}</td>
                <td className="text-center py-2.5 px-2 font-mono text-muted">
                  {r.goalsFor}-{r.goalsAgainst}
                </td>
                <td className="text-center py-2.5 px-3 font-mono font-bold text-lime">{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

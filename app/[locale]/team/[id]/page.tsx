import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { Eyebrow, Stat, FormPill } from "@/components/predictor/ui";
import type { FormResult } from "@/lib/model";

// Public, non-personalized team stats — only change via the daily sync
// crons, so a short revalidate avoids a full DB round-trip on every visit.
export const revalidate = 60;

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teamId = Number(id);
  if (Number.isNaN(teamId)) notFound();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { keyPlayers: true, league: true },
  });
  if (!team) notFound();

  const [standing, recent] = await Promise.all([
    prisma.standing.findUnique({ where: { leagueId_teamId: { leagueId: team.leagueId, teamId } } }),
    prisma.fixture.findMany({
      where: { status: "FINISHED", OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { kickoff: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-5 py-6 pb-16">
      <Link href="/" className="inline-flex items-center gap-1 text-xs mb-6 text-muted hover:text-ink transition-colors">
        <ChevronLeft size={14} /> Πίσω
      </Link>

      <Eyebrow>{team.league.name}</Eyebrow>
      <h1 className="font-display text-3xl mb-2 font-extrabold text-ink tracking-tight">{team.name}</h1>
      <div className="flex items-center gap-3 mb-6">
        {(standing?.rank ?? team.leaguePos) && (
          <span className="text-xs font-mono font-bold text-lime">#{standing?.rank ?? team.leaguePos} στη βαθμολογία</span>
        )}
        <div className="flex gap-1.5">
          {(team.form as FormResult[]).map((r, i) => (
            <FormPill key={i} r={r} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
        <Stat label="Γκολ υπέρ (μ.ό.)" value={team.avgGoalsFor?.toFixed(2) ?? "—"} />
        <Stat label="Γκολ κατά (μ.ό.)" value={team.avgGoalsAgainst?.toFixed(2) ?? "—"} />
        {standing && (
          <>
            <Stat label="Βαθμοί" value={`${standing.points}`} sub={`${standing.played} αγ.`} />
            <Stat label="Νίκες-Ισοπ.-Ήττες" value={`${standing.win}-${standing.draw}-${standing.lose}`} sub={`${standing.goalsFor}-${standing.goalsAgainst} γκολ`} />
          </>
        )}
      </div>

      {team.keyPlayers.length > 0 && (
        <>
          <Eyebrow>Βασικοί παίχτες</Eyebrow>
          <div className="grid sm:grid-cols-2 gap-1.5 mb-8">
            {team.keyPlayers.map((p) => (
              <div key={p.id} className="card-interactive flex items-center justify-between py-2.5 px-4">
                <div>
                  <div className="text-xs font-medium text-ink">{p.name}</div>
                  <div className="text-[10px] text-muted">
                    {p.role} · {p.goals}γ σε {p.apps}συμ.
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2.5 py-1 rounded-full font-bold font-mono ${
                    p.status === "fit" ? "bg-lime/15 text-lime" : p.status === "doubtful" ? "bg-amber/15 text-amber" : "bg-rose/15 text-rose"
                  }`}
                >
                  {p.status === "fit" ? "Διαθέσιμος" : p.status === "doubtful" ? "Αμφίβολος" : "Τραυματίας"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <Eyebrow>Τελευταία αποτελέσματα</Eyebrow>
      {recent.length === 0 && (
        <div className="card p-5 text-center">
          <div className="text-xs text-dim">Δεν υπάρχουν ακόμα καταγεγραμμένα αποτελέσματα.</div>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-1.5">
        {recent.map((f) => {
          const isHome = f.homeTeamId === teamId;
          const own = isHome ? f.homeGoals : f.awayGoals;
          const opp = isHome ? f.awayGoals : f.homeGoals;
          const oppTeam = isHome ? f.awayTeam : f.homeTeam;
          const outcome = own == null || opp == null ? null : own > opp ? "W" : own < opp ? "L" : "D";
          return (
            <Link
              key={f.id}
              href={`/match/${f.id}`}
              className="card-interactive flex items-center justify-between py-2.5 px-4"
            >
              <div className="text-xs font-medium text-ink">
                {isHome ? "vs" : "@"} {oppTeam.name}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-ink">
                  {f.homeGoals}-{f.awayGoals}
                </span>
                {outcome && (
                  <span
                    className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono ${
                      outcome === "W" ? "bg-lime text-bg" : outcome === "D" ? "bg-surface3 text-muted" : "bg-rose/90 text-bg"
                    }`}
                  >
                    {outcome}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

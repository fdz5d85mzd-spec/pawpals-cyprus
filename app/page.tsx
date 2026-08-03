import Link from "next/link";
import { prisma } from "@/lib/db";
import { presentPrediction, hoursUntil } from "@/lib/present";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const fixtures = await prisma.fixture.findMany({
    where: { kickoff: { gte: new Date() }, prediction: { isNot: null } },
    include: { homeTeam: true, awayTeam: true, prediction: true },
    orderBy: { kickoff: "asc" },
    take: 20,
  });

  return (
    <div className="max-w-xl mx-auto px-5 py-8">
      <div className="text-[10px] tracking-[0.2em] uppercase font-mono mb-1 text-dim">
        Μαθηματικό μοντέλο · 24ω πριν το ματς
      </div>
      <h1 className="font-display text-4xl mb-1 leading-tight font-bold text-ink">
        Οι αριθμοί
        <br />
        δεν παίρνουν μέρος.
      </h1>
      <p className="text-xs mb-6 text-muted">
        Κάθε πρόβλεψη προκύπτει από στατιστικό μοντέλο Poisson πάνω σε φόρμα, γκολ υπέρ/κατά και έδρα — όχι
        από γνώμη ή οπαδική προκατάληψη.
      </p>

      {fixtures.length === 0 && (
        <div className="rounded-xl p-4 text-xs text-dim border border-dashed border-border">
          Καμία παγωμένη πρόβλεψη αυτή τη στιγμή. Ο scheduler παγώνει προβλέψεις 24ω πριν κάθε αγώνα.
        </div>
      )}

      {fixtures.map((f) => {
        if (!f.prediction) return null;
        const model = presentPrediction(f.prediction);
        const hrs = hoursUntil(f.kickoff);
        return (
          <Link
            key={f.id}
            href={`/match/${f.id}`}
            className="block w-full text-left rounded-2xl mb-4 p-5 bg-surface border border-border"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-mono mb-3 text-amber">
              <span>Έναρξη σε {hrs}ω{f.venue ? ` · ${f.venue}` : ""}</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 text-center">
                <div className="font-display text-lg text-ink">{f.homeTeam.name}</div>
                {f.homeTeam.leaguePos && <div className="text-[10px] font-mono text-dim">#{f.homeTeam.leaguePos}</div>}
              </div>
              <div className="font-display text-sm px-2 text-dim">vs</div>
              <div className="flex-1 text-center">
                <div className="font-display text-lg text-ink">{f.awayTeam.name}</div>
                {f.awayTeam.leaguePos && <div className="text-[10px] font-mono text-dim">#{f.awayTeam.leaguePos}</div>}
              </div>
            </div>
            <div className="flex justify-center gap-6 text-xs font-mono mb-2 text-muted">
              <span>
                1 <b className="text-ink">{model.winHome}%</b>
              </span>
              <span>
                X <b className="text-ink">{model.draw}%</b>
              </span>
              <span>
                2 <b className="text-ink">{model.winAway}%</b>
              </span>
            </div>
            <div className="flex justify-center gap-4 text-[10px] font-mono text-dim">
              <span>
                Σκορ {model.scores[0].h}-{model.scores[0].a}
              </span>
              <span>O2.5 {model.ouLines[1].over}%</span>
              <span>GG {model.bttsYes}%</span>
              <span>ΗΜ/ΤΑ {model.htft}</span>
            </div>
          </Link>
        );
      })}

      <div className="mt-6 rounded-xl p-4 text-[11px] leading-relaxed border border-dashed border-border text-dim">
        <b className="text-lime">Κινητήρας.</b> Ένας κοινός πίνακας πιθανοτήτων Poisson τροφοδοτεί όλες τις αγορές
        — 1Χ2, Διπλή Ευκαιρία, Ασιατικό Χάντικαπ, ΗΜ/ΤΑ, Over/Under, BTTS, Ακριβές Σκορ, Σκόρερ. Κόρνερ/Κάρτες
        μένουν σε ξεχωριστό μοντέλο (δεν προκύπτουν από γκολ).
      </div>
    </div>
  );
}

import Link from "next/link";
import { Sigma, Clock, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { presentPrediction, hoursUntil } from "@/lib/present";
import { PickOfDay } from "@/components/predictor/PickOfDay";
import { InstinctQuiz } from "@/components/predictor/InstinctQuiz";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const fixtures = await prisma.fixture.findMany({
    where: { kickoff: { gte: new Date() }, prediction: { isNot: null } },
    include: { homeTeam: true, awayTeam: true, prediction: true },
    orderBy: { kickoff: "asc" },
    take: 20,
  });

  const withModel = fixtures
    .filter((f) => f.prediction)
    .map((f) => ({ fixture: f, model: presentPrediction(f.prediction!) }));

  const pickOfDay = [...withModel].sort((a, b) => b.model.confidence - a.model.confidence)[0];

  return (
    <div className="relative">
      <div className="relative overflow-hidden bg-bg pb-14 pt-12">
        <div
          className="absolute -top-32 -right-24 w-96 h-96 bg-lime"
          style={{ transform: "rotate(24deg)" }}
        />

        <div className="relative max-w-6xl mx-auto px-5">
          <div className="flex items-center gap-2 mb-3 animate-fade-up">
            <Sigma size={14} className="text-lime" />
            <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-dim">
              Μαθηματικό μοντέλο · 24ω πριν το ματς
            </span>
          </div>
          <h1
            className="font-display text-[2.6rem] sm:text-5xl mb-3 leading-[1.05] font-extrabold text-ink uppercase tracking-tight animate-fade-up"
            style={{ animationDelay: "60ms" }}
          >
            Οι αριθμοί
            <br />
            <span className="bg-lime text-bg px-2 inline-block -skew-x-6">δεν παίρνουν μέρος</span>
          </h1>
          <p className="text-sm mt-4 text-muted max-w-md animate-fade-up" style={{ animationDelay: "120ms" }}>
            Κάθε πρόβλεψη προκύπτει από στατιστικό μοντέλο Poisson πάνω σε φόρμα, γκολ υπέρ/κατά και έδρα —
            όχι από γνώμη ή οπαδική προκατάληψη.
          </p>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-5 pt-8 pb-8 lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:items-start">
        <div>
          {fixtures.length === 0 && (
            <div className="card p-6 text-center animate-fade-up">
              <div className="text-sm text-ink font-medium mb-1">Καμία παγωμένη πρόβλεψη αυτή τη στιγμή</div>
              <div className="text-xs text-dim">Ο scheduler παγώνει προβλέψεις 24ω πριν κάθε αγώνα.</div>
            </div>
          )}

          {/* Sidebar content repeated inline on mobile, above the list */}
          {pickOfDay && (
            <div className="mb-4 lg:hidden">
              <PickOfDay
                fixtureId={pickOfDay.fixture.id}
                homeName={pickOfDay.fixture.homeTeam.name}
                awayName={pickOfDay.fixture.awayTeam.name}
                model={pickOfDay.model}
              />
            </div>
          )}

          <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {withModel.map(({ fixture: f, model }, i) => {
              const hrs = hoursUntil(f.kickoff);
              return (
                <Link
                  key={f.id}
                  href={`/match/${f.id}`}
                  className="card-interactive group block w-full text-left p-5 animate-fade-up"
                  style={{ animationDelay: `${160 + i * 60}ms` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber">
                      <Clock size={11} />
                      <span>
                        Έναρξη σε {hrs}ω{f.venue ? ` · ${f.venue}` : ""}
                      </span>
                    </div>
                    <ArrowRight size={14} className="text-dim group-hover:text-lime group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1 text-center">
                      <div className="font-display text-lg text-ink">{f.homeTeam.name}</div>
                      {f.homeTeam.leaguePos && <div className="text-[10px] font-mono text-dim">#{f.homeTeam.leaguePos}</div>}
                    </div>
                    <div className="font-display text-[10px] font-extrabold px-2.5 py-1 bg-surface3 text-lime border border-lime/40 shrink-0">
                      VS
                    </div>
                    <div className="flex-1 text-center">
                      <div className="font-display text-lg text-ink">{f.awayTeam.name}</div>
                      {f.awayTeam.leaguePos && <div className="text-[10px] font-mono text-dim">#{f.awayTeam.leaguePos}</div>}
                    </div>
                  </div>
                  <div className="flex justify-center gap-6 text-xs font-mono mb-3 text-muted">
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
                  <div className="flex justify-center gap-4 text-[10px] font-mono text-dim pt-3 border-t border-border/60">
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
          </div>

          <div className="mt-8 card p-5 text-[11px] leading-relaxed text-dim">
            <b className="text-lime">Κινητήρας.</b> Ένας κοινός πίνακας πιθανοτήτων Poisson τροφοδοτεί όλες τις
            αγορές — 1Χ2, Διπλή Ευκαιρία, Ασιατικό Χάντικαπ, ΗΜ/ΤΑ, Over/Under, BTTS, Ακριβές Σκορ, Σκόρερ.
            Κόρνερ/Κάρτες μένουν σε ξεχωριστό μοντέλο (δεν προκύπτουν από γκολ).
          </div>
        </div>

        <div className="hidden lg:block space-y-4">
          {pickOfDay && (
            <PickOfDay
              fixtureId={pickOfDay.fixture.id}
              homeName={pickOfDay.fixture.homeTeam.name}
              awayName={pickOfDay.fixture.awayTeam.name}
              model={pickOfDay.model}
            />
          )}
          {pickOfDay && (
            <InstinctQuiz
              homeName={pickOfDay.fixture.homeTeam.name}
              awayName={pickOfDay.fixture.awayTeam.name}
              winHome={pickOfDay.model.winHome}
              draw={pickOfDay.model.draw}
              winAway={pickOfDay.model.winAway}
            />
          )}
        </div>

        {pickOfDay && (
          <div className="mt-4 lg:hidden">
            <InstinctQuiz
              homeName={pickOfDay.fixture.homeTeam.name}
              awayName={pickOfDay.fixture.awayTeam.name}
              winHome={pickOfDay.model.winHome}
              draw={pickOfDay.model.draw}
              winAway={pickOfDay.model.winAway}
            />
          </div>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock } from "lucide-react";
import { prisma } from "@/lib/db";
import { presentPrediction, hoursUntil } from "@/lib/present";
import { getCurrentPlan } from "@/lib/plan";
import { Eyebrow, Bar, Stat, Row, FormPill, ProGate } from "@/components/predictor/ui";
import { ScoreHeatmap } from "@/components/predictor/ScoreHeatmap";
import { Comments } from "@/components/predictor/Comments";
import type { FormResult } from "@/lib/model";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fixtureId = Number(id);
  if (Number.isNaN(fixtureId)) notFound();

  const [fixture, plan, comments] = await Promise.all([
    prisma.fixture.findUnique({
      where: { id: fixtureId },
      include: { homeTeam: { include: { keyPlayers: true } }, awayTeam: { include: { keyPlayers: true } }, prediction: true },
    }),
    getCurrentPlan(),
    prisma.matchComment.findMany({
      where: { fixtureId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  if (!fixture || !fixture.prediction) notFound();

  const model = presentPrediction(fixture.prediction);
  const hrs = hoursUntil(fixture.kickoff);
  const isPro = plan === "PRO";
  const home = fixture.homeTeam;
  const away = fixture.awayTeam;

  return (
    <div className="max-w-xl mx-auto px-5 py-6 pb-16">
      <Link href="/" className="inline-flex items-center gap-1 text-xs mb-6 text-muted hover:text-ink transition-colors">
        <ChevronLeft size={14} /> Πίσω
      </Link>

      <div className="flex items-center gap-1.5 text-[10px] font-mono mb-4 text-amber">
        <Clock size={11} />
        <span>
          Κλείδωμα πρόγνωσης σε {hrs}ω{fixture.venue ? ` · ${fixture.venue}` : ""}
        </span>
      </div>

      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 text-center">
            <div className="font-display text-xl text-ink font-bold">{home.shortName}</div>
            <div className="flex justify-center gap-1.5 mt-2.5">
              {(home.form as FormResult[]).map((r, i) => (
                <FormPill key={i} r={r} />
              ))}
            </div>
          </div>
          <div className="font-display text-lg px-3 text-dim">—</div>
          <div className="flex-1 text-center">
            <div className="font-display text-xl text-ink font-bold">{away.shortName}</div>
            <div className="flex justify-center gap-1.5 mt-2.5">
              {(away.form as FormResult[]).map((r, i) => (
                <FormPill key={i} r={r} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-8 text-[10px] font-mono pt-3 border-t border-border/60 text-dim">
          <span>λ {model.lambdaHome.toFixed(2)}</span>
          <span>λ {model.lambdaAway.toFixed(2)}</span>
        </div>
      </div>

      <div className="mb-6">
        <ScoreHeatmap matrix={model.matrix} homeShort={home.shortName} awayShort={away.shortName} />
      </div>

      <Eyebrow>Αποτέλεσμα (1Χ2)</Eyebrow>
      <Bar label={home.name} value={model.winHome} color="#FFC800" />
      <Bar label="Ισοπαλία" value={model.draw} color="#6B6B70" />
      <Bar label={away.name} value={model.winAway} color="#E8E8EA" />

      <ProGate isPro={isPro}>
        <div className="mt-6">
          <Eyebrow>Διπλή ευκαιρία</Eyebrow>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="1Χ" value={`${model.doubleChance.oneX}%`} />
          <Stat label="12" value={`${model.doubleChance.oneTwo}%`} />
          <Stat label="Χ2" value={`${model.doubleChance.xTwo}%`} />
        </div>

        <div className="mt-6">
          <Eyebrow>Ασιατικό χάντικαπ</Eyebrow>
        </div>
        <Row
          label={`${model.asianHandicap.pick} ${model.asianHandicap.line > 0 ? "+" : ""}${model.asianHandicap.line}`}
          value={`${model.asianHandicap.confidence}%`}
          sub="Δίκαιη γραμμή μοντέλου (κάλυψη ≈ 50/50)"
        />

        <div className="mt-6">
          <Eyebrow>Ημίχρονο / Τελικό</Eyebrow>
        </div>
        <Row label={model.htft} value={`${model.htftConfidence}%`} sub="Πιο πιθανός συνδυασμός ΗΜ/ΤΑ" />

        <div className="mt-6">
          <Eyebrow>Over / Under γκολ</Eyebrow>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {model.ouLines.map((l) => (
            <Stat key={l.line} label={`Γραμμή ${l.line}`} value={`${l.over}%`} sub={`Under ${l.under}%`} />
          ))}
        </div>

        <div className="mt-6">
          <Eyebrow>Ακριβές σκορ · top 3</Eyebrow>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {model.scores.map((s, i) => (
            <Stat key={i} label={i === 0 ? "Πιο πιθανό" : `#${i + 1}`} value={`${s.h}-${s.a}`} sub={`${s.pct}%`} />
          ))}
        </div>

        <div className="mt-6">
          <Eyebrow>Λοιπές αγορές</Eyebrow>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="BTTS (GG)" value={`${model.bttsYes}%`} />
          <Stat label="Κόρνερ O9.5" value={`${model.cornersOver95}%`} sub={`~${model.corners} αναμ.`} />
          <Stat label="Κάρτες O4.5" value={`${model.cardsOver45}%`} sub={`~${model.cards} αναμ.`} />
          <Stat label="Confidence" value={`${model.confidence}%`} />
        </div>

        {model.scorer && (
          <>
            <div className="mt-6">
              <Eyebrow>Πρόταση σκόρερ</Eyebrow>
            </div>
            <Row
              label={model.scorer.name}
              value={`${model.scorer.prob}%`}
              sub={`${model.scorer.role} · ${model.scorer.goals} γκολ σε ${model.scorer.apps} συμμ. · να σκοράρει ανά πάσα στιγμή`}
            />
          </>
        )}

        <div className="mt-6">
          <Eyebrow>Βασικοί παίχτες</Eyebrow>
        </div>
        {[...home.keyPlayers, ...away.keyPlayers].map((p) => (
          <div key={p.id} className="card-interactive flex items-center justify-between py-2.5 px-4 mb-1.5">
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
      </ProGate>

      <Comments
        fixtureId={fixture.id}
        initialComments={comments.map((c) => ({
          id: c.id,
          body: c.body,
          createdAt: c.createdAt.toISOString(),
          userName: c.user.name ?? c.user.email,
        }))}
      />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { presentPrediction, hoursUntil } from "@/lib/present";
import { getCurrentPlan } from "@/lib/plan";
import { Eyebrow, Bar, Stat, Row, FormPill, ProGate } from "@/components/predictor/ui";
import { ScoreHeatmap } from "@/components/predictor/ScoreHeatmap";
import type { FormResult } from "@/lib/model";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fixtureId = Number(id);
  if (Number.isNaN(fixtureId)) notFound();

  const [fixture, plan] = await Promise.all([
    prisma.fixture.findUnique({
      where: { id: fixtureId },
      include: { homeTeam: { include: { keyPlayers: true } }, awayTeam: { include: { keyPlayers: true } }, prediction: true },
    }),
    getCurrentPlan(),
  ]);

  if (!fixture || !fixture.prediction) notFound();

  const model = presentPrediction(fixture.prediction);
  const hrs = hoursUntil(fixture.kickoff);
  const isPro = plan === "PRO";
  const home = fixture.homeTeam;
  const away = fixture.awayTeam;

  return (
    <div className="max-w-xl mx-auto px-5 py-6 pb-16">
      <Link href="/" className="flex items-center gap-1 text-xs mb-5 text-muted">
        <ChevronLeft size={14} /> Πίσω
      </Link>

      <div className="flex items-center gap-1.5 text-[10px] font-mono mb-3 text-amber">
        <span>
          Κλείδωμα πρόγνωσης σε {hrs}ω{fixture.venue ? ` · ${fixture.venue}` : ""}
        </span>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 text-center">
          <div className="font-display text-xl text-ink">{home.shortName}</div>
          <div className="flex justify-center gap-1 mt-2">
            {(home.form as FormResult[]).map((r, i) => (
              <FormPill key={i} r={r} />
            ))}
          </div>
        </div>
        <div className="font-display text-lg px-2 text-dim">—</div>
        <div className="flex-1 text-center">
          <div className="font-display text-xl text-ink">{away.shortName}</div>
          <div className="flex justify-center gap-1 mt-2">
            {(away.form as FormResult[]).map((r, i) => (
              <FormPill key={i} r={r} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-8 text-[10px] font-mono mb-6 text-dim">
        <span>λ {model.lambdaHome.toFixed(2)}</span>
        <span>λ {model.lambdaAway.toFixed(2)}</span>
      </div>

      <div className="mb-6">
        <ScoreHeatmap matrix={model.matrix} homeShort={home.shortName} awayShort={away.shortName} />
      </div>

      <Eyebrow>Αποτέλεσμα (1Χ2)</Eyebrow>
      <Bar label={home.name} value={model.winHome} color="#C6F17A" />
      <Bar label="Ισοπαλία" value={model.draw} color="#5D7266" />
      <Bar label={away.name} value={model.winAway} color="#5B7FFF" />

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
          <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg mb-1.5 bg-surface">
            <div>
              <div className="text-xs font-medium text-ink">{p.name}</div>
              <div className="text-[10px] text-muted">
                {p.role} · {p.goals}γ σε {p.apps}συμ.
              </div>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                p.status === "fit"
                  ? "bg-[#173226] text-lime"
                  : p.status === "doubtful"
                  ? "bg-[#3A2E12] text-amber"
                  : "bg-[#3A1712] text-[#E0665A]"
              }`}
            >
              {p.status === "fit" ? "Διαθέσιμος" : p.status === "doubtful" ? "Αμφίβολος" : "Τραυματίας"}
            </span>
          </div>
        ))}
      </ProGate>
    </div>
  );
}

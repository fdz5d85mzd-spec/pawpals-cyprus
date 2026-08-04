import { Gauge } from "lucide-react";
import { prisma } from "@/lib/db";
import { Eyebrow } from "@/components/predictor/ui";

export const dynamic = "force-dynamic";

const MARKET_LABELS: Record<string, string> = {
  ONE_X_TWO: "1Χ2",
  DOUBLE_CHANCE: "Διπλή ευκαιρία",
  ASIAN_HANDICAP: "Ασιατικό χάντικαπ",
  HT_FT: "ΗΜ/ΤΑ",
  OVER_UNDER_2_5: "O/U 2.5",
  BTTS: "BTTS",
  CORRECT_SCORE: "Ακριβές σκορ",
};

export default async function HistoryPage() {
  const results = await prisma.predictionResult.findMany({
    include: { prediction: { include: { fixture: { include: { homeTeam: true, awayTeam: true } } } } },
    orderBy: { settledAt: "desc" },
    take: 100,
  });

  const total = results.length;
  const correct = results.filter((r) => r.hit).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const byMarket = new Map<string, { total: number; hits: number }>();
  for (const r of results) {
    const entry = byMarket.get(r.market) ?? { total: 0, hits: 0 };
    entry.total++;
    if (r.hit) entry.hits++;
    byMarket.set(r.market, entry);
  }

  return (
    <div className="max-w-xl mx-auto px-5 pt-8 pb-16">
      <div className="flex items-center gap-2 mb-2 animate-fade-up">
        <Gauge size={16} className="text-lime" />
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-dim">Διαφάνεια μοντέλου</span>
      </div>
      <h1 className="font-display text-4xl mb-6 font-extrabold text-ink tracking-tight animate-fade-up" style={{ animationDelay: "60ms" }}>
        Πόσο σωστό ήταν;
      </h1>

      <div className="card p-6 mb-8 flex items-center gap-5 animate-fade-up" style={{ animationDelay: "120ms" }}>
        <div className="font-display text-5xl font-mono text-gradient">{accuracy}%</div>
        <div className="text-xs text-muted leading-relaxed">
          Επιτυχείς προβλέψεις σε {total} τελειωμένους αγώνες/αγορές ({correct}/{total}). Ενημερώνεται αυτόματα
          μόλις τελειώνει κάθε αγώνας.
        </div>
      </div>

      {byMarket.size > 0 && (
        <>
          <Eyebrow>Ανά αγορά</Eyebrow>
          <div className="grid grid-cols-2 gap-2 mb-8">
            {Array.from(byMarket.entries()).map(([market, { total, hits }]) => (
              <div key={market} className="card p-3.5">
                <div className="text-[9px] uppercase tracking-wide font-mono mb-1.5 text-dim">
                  {MARKET_LABELS[market] ?? market}
                </div>
                <div className="text-lg font-bold font-mono text-lime">{Math.round((hits / total) * 100)}%</div>
                <div className="text-[10px] mt-1 text-muted">
                  {hits}/{total}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Eyebrow>Τελευταίες προβλέψεις vs αποτέλεσμα</Eyebrow>
      {results.length === 0 && (
        <div className="card p-6 text-center">
          <div className="text-xs text-dim">Δεν υπάρχουν ακόμα τελειωμένοι αγώνες με παγωμένη πρόβλεψη.</div>
        </div>
      )}
      <div className="space-y-2">
        {results.map((r) => (
          <div key={r.id} className="card-interactive flex items-center justify-between py-3 px-4">
            <div>
              <div className="text-xs font-medium text-ink">
                {r.prediction.fixture.homeTeam.name} – {r.prediction.fixture.awayTeam.name}
              </div>
              <div className="text-[10px] font-mono mt-0.5 text-dim">
                {MARKET_LABELS[r.market] ?? r.market} · πρόβλεψη: {r.predicted} ({r.predictedPct}%) · τελικό:{" "}
                {r.actual}
              </div>
            </div>
            <span
              className={`text-[10px] px-2.5 py-1 rounded-full font-bold font-mono shrink-0 ml-2 ${
                r.hit ? "bg-lime/15 text-lime" : "bg-rose/15 text-rose"
              }`}
            >
              {r.hit ? "✓ Σωστό" : "✕ Λάθος"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Gauge } from "lucide-react";
import { prisma } from "@/lib/db";

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
    <div className="max-w-xl mx-auto px-5 pt-5 pb-16">
      <div className="flex items-center gap-2 mb-1 mt-2">
        <Gauge size={18} className="text-lime" />
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-dim">Διαφάνεια μοντέλου</span>
      </div>
      <h1 className="font-display text-3xl mb-4 font-bold text-ink">Πόσο σωστό ήταν;</h1>

      <div className="rounded-2xl p-5 mb-6 flex items-center gap-4 bg-surface border border-border">
        <div className="font-display text-4xl font-mono text-lime">{accuracy}%</div>
        <div className="text-xs text-muted">
          Επιτυχείς προβλέψεις σε {total} τελειωμένους αγώνες/αγορές ({correct}/{total}). Ενημερώνεται αυτόματα
          μόλις τελειώνει κάθε αγώνας.
        </div>
      </div>

      {byMarket.size > 0 && (
        <>
          <div className="text-[10px] tracking-[0.18em] uppercase font-mono mb-2 text-dim">Ανά αγορά</div>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {Array.from(byMarket.entries()).map(([market, { total, hits }]) => (
              <div key={market} className="rounded-xl py-3 px-3 bg-surface border border-border">
                <div className="text-[9px] uppercase tracking-wide font-mono mb-1 text-dim">
                  {MARKET_LABELS[market] ?? market}
                </div>
                <div className="text-base font-bold font-mono text-lime">
                  {Math.round((hits / total) * 100)}%
                </div>
                <div className="text-[10px] mt-0.5 text-muted">
                  {hits}/{total}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="text-[10px] tracking-[0.18em] uppercase font-mono mb-2 text-dim">
        Τελευταίες προβλέψεις vs αποτέλεσμα
      </div>
      {results.length === 0 && (
        <div className="rounded-xl p-4 text-xs text-dim border border-dashed border-border">
          Δεν υπάρχουν ακόμα τελειωμένοι αγώνες με παγωμένη πρόβλεψη.
        </div>
      )}
      {results.map((r) => (
        <div key={r.id} className="flex items-center justify-between py-3 px-3 rounded-lg mb-1.5 bg-surface">
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
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono shrink-0 ml-2 ${
              r.hit ? "bg-[#173226] text-lime" : "bg-[#3A1712] text-[#E0665A]"
            }`}
          >
            {r.hit ? "✓ Σωστό" : "✕ Λάθος"}
          </span>
        </div>
      ))}
    </div>
  );
}

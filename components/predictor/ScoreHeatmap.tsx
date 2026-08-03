import { Eyebrow } from "./ui";

// Signature element: exact-score heatmap — visual proof the prediction comes
// from a probability matrix, not a guess.
export function ScoreHeatmap({
  matrix,
  homeShort,
  awayShort,
}: {
  matrix: number[][];
  homeShort: string;
  awayShort: string;
}) {
  const size = 6; // 0..5 goals per team
  let max = 0;
  for (let h = 0; h < size; h++) for (let a = 0; a < size; a++) max = Math.max(max, matrix[h][a]);

  return (
    <div className="rounded-2xl p-4 bg-surface border border-border">
      <Eyebrow>Πίνακας πιθανοτήτων σκορ · Poisson</Eyebrow>
      <div className="flex">
        <div className="flex flex-col justify-end pr-1.5 pt-5">
          {Array.from({ length: size }).map((_, a) => (
            <div key={a} className="h-7 flex items-center text-[9px] font-mono text-dim">
              {a}
            </div>
          ))}
        </div>
        <div>
          <div className="text-[9px] font-mono mb-1 text-center text-dim">{awayShort} →</div>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${size}, 1.75rem)` }}>
            {Array.from({ length: size }).flatMap((_, h) =>
              Array.from({ length: size }).map((_, a) => {
                const p = matrix[h][a];
                const intensity = max > 0 ? p / max : 0;
                return (
                  <div
                    key={`${h}-${a}`}
                    className="h-7 flex items-center justify-center text-[9px] font-mono rounded"
                    style={{
                      background: `rgba(198,241,122,${0.08 + intensity * 0.75})`,
                      color: intensity > 0.55 ? "#0A1712" : "#82988A",
                      fontWeight: intensity > 0.55 ? 700 : 400,
                    }}
                  >
                    {Math.round(p * 100)}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <div className="text-[9px] font-mono mt-1 text-center text-dim">
        ↑ {homeShort} (γραμμές) · ποσοστό % ανά κελί
      </div>
    </div>
  );
}

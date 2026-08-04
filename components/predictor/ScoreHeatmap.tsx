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
    <div className="card p-5">
      <Eyebrow>Πίνακας πιθανοτήτων σκορ · Poisson</Eyebrow>
      <div className="flex">
        <div className="flex flex-col justify-end pr-2 pt-5">
          {Array.from({ length: size }).map((_, a) => (
            <div key={a} className="h-8 flex items-center text-[9px] font-mono text-dim">
              {a}
            </div>
          ))}
        </div>
        <div>
          <div className="text-[9px] font-mono mb-1.5 text-center text-dim">{awayShort} →</div>
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${size}, 1.9rem)` }}>
            {Array.from({ length: size }).flatMap((_, h) =>
              Array.from({ length: size }).map((_, a) => {
                const p = matrix[h][a];
                const intensity = max > 0 ? p / max : 0;
                return (
                  <div
                    key={`${h}-${a}`}
                    className="h-8 flex items-center justify-center text-[9px] font-mono rounded-md transition-transform duration-150 hover:scale-110 hover:z-10"
                    style={{
                      background: `rgba(198,241,122,${0.06 + intensity * 0.8})`,
                      color: intensity > 0.5 ? "#080F0C" : "#8AA398",
                      fontWeight: intensity > 0.5 ? 700 : 400,
                      boxShadow: intensity > 0.5 ? "0 0 12px rgba(198,241,122,0.35)" : "none",
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
      <div className="text-[9px] font-mono mt-2 text-center text-dim">
        ↑ {homeShort} (γραμμές) · ποσοστό % ανά κελί
      </div>
    </div>
  );
}

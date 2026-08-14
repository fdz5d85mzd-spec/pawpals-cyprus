export interface CalibrationInput {
  predictedPct: number;
  hit: boolean;
}

export interface CalibrationBucket {
  label: string;
  min: number;
  max: number;
  total: number;
  hits: number;
  expected: number;
  actual: number;
  gap: number;
}

const BUCKETS = [
  { label: "0–19%", min: 0, max: 19 },
  { label: "20–39%", min: 20, max: 39 },
  { label: "40–59%", min: 40, max: 59 },
  { label: "60–79%", min: 60, max: 79 },
  { label: "80–100%", min: 80, max: 100 },
];

export function buildCalibration(inputs: CalibrationInput[]): CalibrationBucket[] {
  return BUCKETS.map((bucket) => {
    const rows = inputs.filter((input) => input.predictedPct >= bucket.min && input.predictedPct <= bucket.max);
    const hits = rows.filter((row) => row.hit).length;
    const expected = rows.length
      ? Math.round(rows.reduce((sum, row) => sum + row.predictedPct, 0) / rows.length)
      : 0;
    const actual = rows.length ? Math.round((hits / rows.length) * 100) : 0;

    return {
      ...bucket,
      total: rows.length,
      hits,
      expected,
      actual,
      gap: actual - expected,
    };
  }).filter((bucket) => bucket.total > 0);
}

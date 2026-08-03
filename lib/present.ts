import type { PredictionSnapshot } from "@prisma/client";

// Prisma stores several model outputs as JSON columns; this casts them back
// to the shapes lib/model.ts produced them in, for rendering.
export function presentPrediction(p: PredictionSnapshot) {
  return {
    ...p,
    doubleChance: p.doubleChance as { oneX: number; oneTwo: number; xTwo: number },
    ouLines: p.ouLines as { line: number; over: number; under: number }[],
    scores: p.scores as { h: number; a: number; p: number; pct: number }[],
    asianHandicap: p.asianHandicap as {
      line: number;
      side: "home" | "away";
      pick: string;
      confidence: number;
    },
    scorer: p.scorer as
      | { name: string; role: string; goals: number; apps: number; status: string; prob: number }
      | null,
    matrix: p.matrix as number[][],
  };
}

export type PresentedPrediction = ReturnType<typeof presentPrediction>;

export function hoursUntil(date: Date) {
  return Math.max(0, Math.round((date.getTime() - Date.now()) / 3600000));
}

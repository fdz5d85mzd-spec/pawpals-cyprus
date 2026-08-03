import { Market, type PredictionSnapshot } from "@prisma/client";

export interface FinalScore {
  homeGoals: number;
  awayGoals: number;
  htHomeGoals: number | null;
  htAwayGoals: number | null;
}

interface Grade {
  market: Market;
  predicted: string;
  predictedPct: number;
  actual: string;
  hit: boolean;
}

// Grades a frozen PredictionSnapshot against the fixture's real result, one
// row per market. Called once per fixture, after it's confirmed FINISHED.
export function gradePrediction(p: PredictionSnapshot, score: FinalScore): Grade[] {
  const grades: Grade[] = [];
  const totalGoals = score.homeGoals + score.awayGoals;
  const actual1x2 = score.homeGoals > score.awayGoals ? "1" : score.homeGoals === score.awayGoals ? "X" : "2";

  // 1X2
  const pick1x2 =
    p.winHome >= p.draw && p.winHome >= p.winAway ? "1" : p.winAway >= p.draw && p.winAway >= p.winHome ? "2" : "X";
  grades.push({
    market: Market.ONE_X_TWO,
    predicted: pick1x2,
    predictedPct: pick1x2 === "1" ? p.winHome : pick1x2 === "2" ? p.winAway : p.draw,
    actual: actual1x2,
    hit: pick1x2 === actual1x2,
  });

  // Double chance
  const dc = p.doubleChance as { oneX: number; oneTwo: number; xTwo: number };
  const dcEntries: [string, number][] = [
    ["1X", dc.oneX],
    ["12", dc.oneTwo],
    ["X2", dc.xTwo],
  ];
  const [dcPick, dcPct] = dcEntries.sort((a, b) => b[1] - a[1])[0];
  const dcCovers = dcPick.includes(actual1x2) || (dcPick === "12" && actual1x2 !== "X");
  grades.push({
    market: Market.DOUBLE_CHANCE,
    predicted: dcPick,
    predictedPct: dcPct,
    actual: actual1x2,
    hit: dcCovers,
  });

  // Asian handicap. `line` is stored from the home team's perspective, so the
  // underlying model line (applied directly to home - away) is its negation.
  const ah = p.asianHandicap as { line: number; side: "home" | "away"; pick: string; confidence: number };
  const diff = score.homeGoals - score.awayGoals - ah.line;
  const hitAh = diff === 0 ? false : ah.side === "home" ? diff > 0 : diff < 0;
  grades.push({
    market: Market.ASIAN_HANDICAP,
    predicted: `${ah.pick} ${ah.line > 0 ? "+" : ""}${ah.line}`,
    predictedPct: ah.confidence,
    actual: `${score.homeGoals}-${score.awayGoals}`,
    hit: hitAh,
  });

  // HT/FT
  if (score.htHomeGoals !== null && score.htAwayGoals !== null) {
    const htActual = score.htHomeGoals > score.htAwayGoals ? "1" : score.htHomeGoals === score.htAwayGoals ? "X" : "2";
    const actualHtFt = `${htActual}/${actual1x2}`;
    grades.push({
      market: Market.HT_FT,
      predicted: p.htft,
      predictedPct: p.htftConfidence,
      actual: actualHtFt,
      hit: p.htft === actualHtFt,
    });
  }

  // Over/Under 2.5
  const ou25 = (p.ouLines as { line: number; over: number; under: number }[]).find((l) => l.line === 2.5)!;
  const predictedOu = ou25.over >= 50 ? "Over 2.5" : "Under 2.5";
  const actualOu = totalGoals > 2.5 ? "Over 2.5" : "Under 2.5";
  grades.push({
    market: Market.OVER_UNDER_2_5,
    predicted: predictedOu,
    predictedPct: Math.max(ou25.over, ou25.under),
    actual: actualOu,
    hit: predictedOu === actualOu,
  });

  // BTTS
  const predictedBtts = p.bttsYes >= 50 ? "GG" : "NG";
  const actualBtts = score.homeGoals >= 1 && score.awayGoals >= 1 ? "GG" : "NG";
  grades.push({
    market: Market.BTTS,
    predicted: predictedBtts,
    predictedPct: p.bttsYes >= 50 ? p.bttsYes : 100 - p.bttsYes,
    actual: actualBtts,
    hit: predictedBtts === actualBtts,
  });

  // Correct score (top pick only)
  const scores = p.scores as { h: number; a: number; pct: number }[];
  const topScore = scores[0];
  grades.push({
    market: Market.CORRECT_SCORE,
    predicted: `${topScore.h}-${topScore.a}`,
    predictedPct: topScore.pct,
    actual: `${score.homeGoals}-${score.awayGoals}`,
    hit: topScore.h === score.homeGoals && topScore.a === score.awayGoals,
  });

  return grades;
}

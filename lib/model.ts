// Poisson goal-matrix model with Dixon-Coles correction.
//
// Ported as-is from the original football-predictor.jsx prototype
// (computeModel/buildMatrix/tauDC etc.) — only the inputs changed: instead of
// looking teams up in a hardcoded TEAMS object, computeModel now takes the
// home/away TeamStats directly, so it can be fed from the database instead
// of mock data.

export type FormResult = "W" | "D" | "L";
export type PlayerStatus = "fit" | "doubtful" | "injured";

export interface KeyPlayer {
  name: string;
  role: string;
  goals: number;
  apps: number;
  status: PlayerStatus;
}

export interface TeamStats {
  name: string;
  short: string;
  color?: string;
  form: FormResult[];
  gf: number[];
  ga: number[];
  leaguePos: number;
  avgGoalsFor: number;
  avgGoalsAgainst: number;
  keyPlayers: KeyPlayer[];
}

export interface FixtureInput {
  home: TeamStats;
  away: TeamStats;
}

const MAX_GOALS = 7;

const formPoints = (form: FormResult[]) =>
  form.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);

const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));

const poissonP = (lambda: number, k: number) =>
  (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);

// Dixon-Coles τ(h,a): correction only on the 4 low scores (0-0,1-0,0-1,1-1),
// where plain Poisson underestimates the correlation between the two scores.
// rho < 0 slightly reduces drawn low scores, boosts 1-0/0-1.
function tauDC(h: number, a: number, lambdaHome: number, lambdaAway: number, rho: number) {
  if (h === 0 && a === 0) return 1 - lambdaHome * lambdaAway * rho;
  if (h === 0 && a === 1) return 1 + lambdaHome * rho;
  if (h === 1 && a === 0) return 1 + lambdaAway * rho;
  if (h === 1 && a === 1) return 1 - rho;
  return 1;
}

export function buildMatrix(lambdaHome: number, lambdaAway: number, rho = -0.12): number[][] {
  const m: number[][] = [];
  for (let h = 0; h <= MAX_GOALS; h++) {
    const row: number[] = [];
    for (let a = 0; a <= MAX_GOALS; a++) {
      const base = poissonP(lambdaHome, h) * poissonP(lambdaAway, a);
      row.push(base * tauDC(h, a, lambdaHome, lambdaAway, rho));
    }
    m.push(row);
  }
  // renormalize so the total stays 1 after the correction
  let total = 0;
  for (let h = 0; h <= MAX_GOALS; h++) for (let a = 0; a <= MAX_GOALS; a++) total += m[h][a];
  for (let h = 0; h <= MAX_GOALS; h++) for (let a = 0; a <= MAX_GOALS; a++) m[h][a] /= total;
  return m;
}

function sumWhere(matrix: number[][], predicate: (h: number, a: number) => boolean) {
  let s = 0;
  for (let h = 0; h < matrix.length; h++)
    for (let a = 0; a < matrix[h].length; a++) if (predicate(h, a)) s += matrix[h][a];
  return s;
}

function topScores(matrix: number[][], n = 3) {
  const flat: { h: number; a: number; p: number }[] = [];
  for (let h = 0; h < matrix.length; h++)
    for (let a = 0; a < matrix[h].length; a++) flat.push({ h, a, p: matrix[h][a] });
  return flat.sort((x, y) => y.p - x.p).slice(0, n);
}

export interface ModelOutput {
  lambdaHome: number;
  lambdaAway: number;
  matrix: number[][];
  winHome: number;
  draw: number;
  winAway: number;
  doubleChance: { oneX: number; oneTwo: number; xTwo: number };
  bttsYes: number;
  ouLines: { line: number; over: number; under: number }[];
  scores: { h: number; a: number; p: number; pct: number }[];
  asianHandicap: { line: number; side: "home" | "away"; pick: string; confidence: number };
  htft: string;
  htftConfidence: number;
  corners: number;
  cornersOver95: number;
  cards: number;
  cardsOver45: number;
  scorer?: KeyPlayer & { prob: number };
  confidence: number;
}

export function computeModel({ home, away }: FixtureInput): ModelOutput {
  // λ (expected goals) from form + attacking/defensive output + home advantage
  const homeForm = formPoints(home.form) / 15; // 0..1
  const awayForm = formPoints(away.form) / 15;
  const lambdaHome = Math.max(
    0.25,
    home.avgGoalsFor * 0.55 + away.avgGoalsAgainst * 0.35 + homeForm * 0.4 + 0.25
  );
  const lambdaAway = Math.max(
    0.2,
    away.avgGoalsFor * 0.55 + home.avgGoalsAgainst * 0.35 + awayForm * 0.3
  );

  const matrix = buildMatrix(lambdaHome, lambdaAway);

  const winHome = sumWhere(matrix, (h, a) => h > a);
  const draw = sumWhere(matrix, (h, a) => h === a);
  const winAway = sumWhere(matrix, (h, a) => h < a);

  const doubleChance = {
    oneX: Math.round((winHome + draw) * 100),
    oneTwo: Math.round((winHome + winAway) * 100),
    xTwo: Math.round((draw + winAway) * 100),
  };

  const bttsYes = sumWhere(matrix, (h, a) => h >= 1 && a >= 1);

  const overUnder = (line: number) => {
    const over = sumWhere(matrix, (h, a) => h + a > line);
    return { line, over: Math.round(over * 100), under: Math.round((1 - over) * 100) };
  };
  const ouLines = [1.5, 2.5, 3.5].map(overUnder);

  const scores = topScores(matrix, 3).map((s) => ({ ...s, pct: Math.round(s.p * 100) }));

  // Asian handicap: find the line (in 0.25 steps) where coverage gets closest
  // to 50/50 — that's the model's "fair" line.
  let bestLine = 0,
    bestDiff = 1;
  for (let line = -3; line <= 3; line += 0.25) {
    const homeCovers =
      sumWhere(matrix, (h, a) => h - a + line > 0) +
      0.5 * sumWhere(matrix, (h, a) => h - a + line === 0);
    const diff = Math.abs(homeCovers - 0.5);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestLine = line;
    }
  }
  const ahHomeCover =
    sumWhere(matrix, (h, a) => h - a + bestLine > 0) +
    0.5 * sumWhere(matrix, (h, a) => h - a + bestLine === 0);
  const asianHandicap = {
    line: -bestLine, // from the home team's perspective
    side: (ahHomeCover >= 0.5 ? "home" : "away") as "home" | "away",
    pick: ahHomeCover >= 0.5 ? home.short : away.short,
    confidence: Math.round(Math.max(ahHomeCover, 1 - ahHomeCover) * 100),
  };

  // HT/FT: separate, smaller model for the first half (~45% of λ), combined
  // (approximately, assuming independence) with the full-time result.
  const htMatrix = buildMatrix(lambdaHome * 0.45, lambdaAway * 0.45);
  const htHome = sumWhere(htMatrix, (h, a) => h > a);
  const htDraw = sumWhere(htMatrix, (h, a) => h === a);
  const htAway = sumWhere(htMatrix, (h, a) => h < a);
  const htPick = htHome > htDraw && htHome > htAway ? "1" : htAway > htHome && htAway > htDraw ? "2" : "X";
  const ftPick = winHome > draw && winHome > winAway ? "1" : winAway > winHome && winAway > draw ? "2" : "X";
  const htftConfidence = Math.round(
    Math.max(htHome, htDraw, htAway) * Math.max(winHome, draw, winAway) * 140
  );

  // Corners / cards don't come from goals; kept as a separate, simpler
  // statistical model (mean + spread from form/league position).
  const corners = 9 + homeForm * 1.5 + awayForm * 1;
  const cornersOver95 = Math.min(90, Math.max(15, Math.round((corners - 9.5) * 18 + 50)));
  const cards = 3.2 + (5 - home.leaguePos + away.leaguePos) * 0.05;
  const cardsOver45 = Math.min(90, Math.max(15, Math.round((cards - 4.5) * 20 + 50)));

  // Scorer: probability of at least 1 goal, via Poisson on the player's
  // personal goal rate (goals/apps), scaled to the team's expected goals in
  // this match.
  const scorerCandidates = [...home.keyPlayers, ...away.keyPlayers]
    .filter((p) => p.role !== "Τερματοφύλακας" && p.role !== "Goalkeeper")
    .map((p) => {
      const teamLambda = home.keyPlayers.includes(p) ? lambdaHome : lambdaAway;
      const shareOfTeamGoals = p.goals / (p.apps * 1.4); // smoothing
      const personalLambda = Math.max(0.05, shareOfTeamGoals * teamLambda);
      const prob = 1 - Math.exp(-personalLambda);
      return { ...p, prob: Math.round(prob * 100) };
    })
    .sort((a, b) => b.prob - a.prob);

  const confidence = Math.round(Math.max(winHome, draw, winAway) * 100);

  return {
    lambdaHome,
    lambdaAway,
    matrix,
    winHome: Math.round(winHome * 100),
    draw: Math.round(draw * 100),
    winAway: Math.round(winAway * 100),
    doubleChance,
    bttsYes: Math.round(bttsYes * 100),
    ouLines,
    scores,
    asianHandicap,
    htft: `${htPick}/${ftPick}`,
    htftConfidence: Math.min(95, htftConfidence),
    corners: Math.round(corners),
    cornersOver95,
    cards: Math.round(cards * 10) / 10,
    cardsOver45,
    scorer: scorerCandidates[0],
    confidence,
  };
}

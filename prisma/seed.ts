// Demo/local-preview seed data — mirrors the TEAMS/MATCHES/FINISHED_MATCHES
// mock from the original football-predictor.jsx prototype, but pushed
// through Postgres + the real computeModel instead of being hardcoded in
// the UI. Not meant for production; just lets you `npm run dev` and see
// the app working end-to-end without a live API-Football/Stripe setup.
import { PrismaClient, Market, Prisma } from "@prisma/client";
import { computeModel, type TeamStats } from "../lib/model";

const prisma = new PrismaClient();

const ARIS: TeamStats = {
  name: "Άρης",
  short: "ARIS",
  form: ["W", "W", "D", "W", "L"],
  gf: [2, 1, 1, 3, 0],
  ga: [0, 0, 1, 1, 2],
  leaguePos: 3,
  avgGoalsFor: 1.8,
  avgGoalsAgainst: 0.9,
  keyPlayers: [
    { name: "Ν. Παπαδόπουλος", role: "Επιθετικός", goals: 9, apps: 22, status: "fit" },
    { name: "Δ. Ιωάννου", role: "Μέσος", goals: 4, apps: 24, status: "fit" },
    { name: "Κ. Σταύρου", role: "Αμυντικός", goals: 1, apps: 20, status: "doubtful" },
  ],
};

const PAOK: TeamStats = {
  name: "ΠΑΟΚ",
  short: "PAOK",
  form: ["W", "D", "W", "W", "W"],
  gf: [2, 1, 2, 1, 3],
  ga: [1, 1, 0, 0, 1],
  leaguePos: 1,
  avgGoalsFor: 2.1,
  avgGoalsAgainst: 0.7,
  keyPlayers: [
    { name: "Α. Κωνσταντίνου", role: "Επιθετικός", goals: 12, apps: 23, status: "fit" },
    { name: "Γ. Νικολάου", role: "Μέσος", goals: 5, apps: 22, status: "fit" },
    { name: "Ε. Βασιλείου", role: "Τερματοφύλακας", goals: 0, apps: 21, status: "injured" },
  ],
};

async function upsertTeam(id: number, leagueId: number, stats: TeamStats) {
  await prisma.team.upsert({
    where: { id },
    create: {
      id,
      name: stats.name,
      shortName: stats.short,
      leagueId,
      leaguePos: stats.leaguePos,
      avgGoalsFor: stats.avgGoalsFor,
      avgGoalsAgainst: stats.avgGoalsAgainst,
      form: stats.form,
      keyPlayers: { create: stats.keyPlayers.map((p, i) => ({ id: id * 100 + i, ...p })) },
    },
    update: {
      leaguePos: stats.leaguePos,
      avgGoalsFor: stats.avgGoalsFor,
      avgGoalsAgainst: stats.avgGoalsAgainst,
      form: stats.form,
    },
  });
}

async function main() {
  const leagueId = 197; // Greek Super League on API-Football
  await prisma.league.upsert({
    where: { id: leagueId },
    create: { id: leagueId, name: "Super League Ελλάδα", country: "Greece", season: 2026 },
    update: {},
  });

  await upsertTeam(1, leagueId, ARIS);
  await upsertTeam(2, leagueId, PAOK);

  // Upcoming fixture ~22h away, with a frozen prediction (same as the mock).
  const kickoff = new Date(Date.now() + 22 * 3600 * 1000);
  const fixture = await prisma.fixture.upsert({
    where: { id: 1001 },
    create: {
      id: 1001,
      leagueId,
      homeTeamId: 1,
      awayTeamId: 2,
      kickoff,
      venue: "Κλεάνθης Βικελίδης",
    },
    update: { kickoff },
  });

  const model = computeModel({ home: ARIS, away: PAOK });
  await prisma.predictionSnapshot.upsert({
    where: { fixtureId: fixture.id },
    create: {
      fixtureId: fixture.id,
      lambdaHome: model.lambdaHome,
      lambdaAway: model.lambdaAway,
      winHome: model.winHome,
      draw: model.draw,
      winAway: model.winAway,
      doubleChance: model.doubleChance,
      bttsYes: model.bttsYes,
      ouLines: model.ouLines,
      scores: model.scores,
      asianHandicap: model.asianHandicap,
      htft: model.htft,
      htftConfidence: model.htftConfidence,
      corners: model.corners,
      cornersOver95: model.cornersOver95,
      cards: model.cards,
      cardsOver45: model.cardsOver45,
      scorer: model.scorer ? (model.scorer as unknown as Prisma.InputJsonObject) : Prisma.JsonNull,
      confidence: model.confidence,
      matrix: model.matrix,
    },
    update: {},
  });

  // A handful of finished fixtures + graded results, to populate /history.
  const finished: {
    id: number;
    home: string;
    away: string;
    market: Market;
    predicted: string;
    predictedPct: number;
    actual: string;
    hit: boolean;
  }[] = [
    { id: 101, home: "Άρης", away: "ΟΦΗ", market: Market.ONE_X_TWO, predicted: "1", predictedPct: 58, actual: "1", hit: true },
    { id: 102, home: "ΠΑΟΚ", away: "Λεβαδειακός", market: Market.ONE_X_TWO, predicted: "1", predictedPct: 71, actual: "1", hit: true },
    { id: 103, home: "Ολυμπιακός", away: "ΑΕΚ", market: Market.ONE_X_TWO, predicted: "X", predictedPct: 41, actual: "2", hit: false },
    { id: 104, home: "Παναθηναϊκός", away: "Ατρόμητος", market: Market.OVER_UNDER_2_5, predicted: "Over 2.5", predictedPct: 63, actual: "Over 2.5", hit: true },
    { id: 105, home: "Βόλος", away: "Λαμία", market: Market.BTTS, predicted: "GG", predictedPct: 55, actual: "NG", hit: false },
    { id: 106, home: "Άρης", away: "Παναιτωλικός", market: Market.ONE_X_TWO, predicted: "1", predictedPct: 66, actual: "1", hit: true },
    { id: 107, home: "ΠΑΣ Γιάννινα", away: "ΠΑΟΚ", market: Market.ONE_X_TWO, predicted: "2", predictedPct: 52, actual: "X", hit: false },
    { id: 108, home: "ΑΕΚ", away: "ΟΦΗ", market: Market.OVER_UNDER_2_5, predicted: "Under 2.5", predictedPct: 60, actual: "Under 2.5", hit: true },
  ];

  for (const m of finished) {
    const homeId = 1000 + m.id * 2;
    const awayId = homeId + 1;
    await prisma.team.upsert({
      where: { id: homeId },
      create: { id: homeId, name: m.home, shortName: m.home.slice(0, 4).toUpperCase(), leagueId },
      update: {},
    });
    await prisma.team.upsert({
      where: { id: awayId },
      create: { id: awayId, name: m.away, shortName: m.away.slice(0, 4).toUpperCase(), leagueId },
      update: {},
    });
    const pastFixture = await prisma.fixture.upsert({
      where: { id: m.id },
      create: {
        id: m.id,
        leagueId,
        homeTeamId: homeId,
        awayTeamId: awayId,
        kickoff: new Date(Date.now() - (200 - m.id) * 3600 * 1000),
        status: "FINISHED",
        homeGoals: 1,
        awayGoals: 0,
      },
      update: {},
    });
    const snap = await prisma.predictionSnapshot.upsert({
      where: { fixtureId: pastFixture.id },
      create: {
        fixtureId: pastFixture.id,
        lambdaHome: 1.5,
        lambdaAway: 1.1,
        winHome: 50,
        draw: 25,
        winAway: 25,
        doubleChance: { oneX: 75, oneTwo: 75, xTwo: 50 },
        bttsYes: 50,
        ouLines: [
          { line: 1.5, over: 60, under: 40 },
          { line: 2.5, over: 50, under: 50 },
          { line: 3.5, over: 30, under: 70 },
        ],
        scores: [{ h: 1, a: 0, p: 0.2, pct: 20 }],
        asianHandicap: { line: 0, side: "home", pick: "home", confidence: 55 },
        htft: "1/1",
        htftConfidence: 40,
        corners: 10,
        cornersOver95: 55,
        cards: 3.5,
        cardsOver45: 50,
        confidence: 55,
        matrix: [[0.2]],
      },
      update: {},
    });
    await prisma.predictionResult.upsert({
      where: { predictionId_market: { predictionId: snap.id, market: m.market } },
      create: {
        predictionId: snap.id,
        market: m.market,
        predicted: m.predicted,
        predictedPct: m.predictedPct,
        actual: m.actual,
        hit: m.hit,
      },
      update: {},
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

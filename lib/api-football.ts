// Thin client for API-Football (https://www.api-football.com/documentation-v3)
// plus mapping helpers that turn its responses into the TeamStats/FixtureInput
// shape lib/model.ts expects.

const BASE_URL = `https://${process.env.API_FOOTBALL_HOST ?? "v3.football.api-sports.io"}`;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// API-Football's Pro plan caps requests at ~5/second. Firing a batch of
// calls with Promise.all bursts well past that instantly (that's exactly
// what tripped the "Too many requests per minute" error) — this runs them
// one at a time with a floor delay between each instead.
async function throttledMap<T, R>(items: T[], delayMs: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (const item of items) {
    results.push(await fn(item));
    await sleep(delayMs);
  }
  return results;
}

async function afFetch<T>(path: string, params: Record<string, string | number> = {}, revalidateSeconds = 300): Promise<T> {
  const url = new URL(BASE_URL + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const res = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": process.env.API_FOOTBALL_KEY ?? "",
    },
    // Fixture/team data changes slowly enough that a short edge cache is fine
    // on top of our own Postgres cache; the daily cron is the real cache layer.
    // Live-score callers pass a much shorter window (see getLiveFixtures).
    next: { revalidate: revalidateSeconds },
  });

  if (!res.ok) {
    throw new Error(`API-Football ${path} failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  // API-Football returns HTTP 200 even for parameter/plan errors, with the
  // problem described in `errors` (an array, or an object keyed by field)
  // and an empty `response`. Surface that instead of silently returning [].
  const hasErrors = Array.isArray(json.errors) ? json.errors.length > 0 : Object.keys(json.errors ?? {}).length > 0;
  if (hasErrors) {
    throw new Error(`API-Football ${path} returned errors: ${JSON.stringify(json.errors)}`);
  }
  return json.response as T;
}

// ---------------------------------------------------------------------------
// Raw endpoint wrappers
// ---------------------------------------------------------------------------

export interface AFFixture {
  fixture: {
    id: number;
    date: string;
    venue: { name: string | null };
    status: { short: string; elapsed: number | null }; // "NS" not started | "FT" full time | "1H"/"2H"/etc while live
  };
  league: { id: number; season: number; name: string; country: string };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
  };
}

export async function getFixtureById(fixtureId: number): Promise<AFFixture | undefined> {
  const fixtures = await afFetch<AFFixture[]>("/fixtures", { id: fixtureId });
  return fixtures[0];
}

// Leagues Skorama tracks. `from`/`to` alone isn't a valid API-Football query
// (it errors with "need another parameter") — every fixtures-by-date-range
// call must also be scoped to a league, so we can't just ask for "every
// match on Earth". Literally tracking API-Football's full catalog (1000+
// competitions incl. reserve/youth/amateur) would blow the daily request
// budget in a single run and likely time out the cron function.
//
// Instead: all the major Aug-May European leagues (idle outside their
// season) plus leagues on other calendars that are in-season right now
// (MLS, Brazil, Argentina, Mexico, Japan, South Korea run roughly
// Feb/Mar-Nov) — so there's usually something to show year-round.
export const TRACKED_LEAGUES = [
  { id: 197, name: "Super League Ελλάδα" }, // Greece
  { id: 39, name: "Premier League" }, // England
  { id: 140, name: "La Liga" }, // Spain
  { id: 135, name: "Serie A" }, // Italy
  { id: 78, name: "Bundesliga" }, // Germany
  { id: 61, name: "Ligue 1" }, // France
  { id: 253, name: "MLS" }, // USA/Canada, in-season Feb-Dec
  { id: 71, name: "Brasileirão" }, // Brazil, in-season Apr-Dec
  { id: 10, name: "Friendlies" }, // international friendlies, year-round
  { id: 2, name: "UEFA Champions League" }, // qualifying rounds in progress
  { id: 848, name: "UEFA Europa Conference League" }, // qualifying rounds in progress
  { id: 174, name: "Bulgaria Cup" },
  { id: 172, name: "Bulgaria First League" }, // in-season since mid-July
  { id: 656, name: "Bulgaria Super Cup" },
  { id: 237, name: "Russia Cup" },
  { id: 236, name: "Russia First League" }, // in-season since mid-July
  { id: 235, name: "Russia Premier League" }, // in-season since late July
];

// Most European top-flight leagues (incl. the Greek Super League) run
// Aug-May and are labeled by their start year, e.g. the 2026-27 season is
// season=2026 until roughly July 2027. Calendar-year leagues (MLS, Brazil,
// Argentina, Mexico, Japan, South Korea) are actually labeled by the
// current calendar year instead — this heuristic gets those wrong for a
// few months a year (roughly Jan-Jun), which just means sync-fixtures
// finds nothing for that specific league until the estimate lines back up.
export function currentSeasonYear(): number {
  const now = new Date();
  const month = now.getUTCMonth() + 1; // 1-12
  return month >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

export interface LiveScore {
  fixtureId: number;
  homeName: string;
  awayName: string;
  homeGoals: number;
  awayGoals: number;
  elapsed: number | null;
  statusShort: string;
}

const TRACKED_LEAGUE_IDS = new Set(TRACKED_LEAGUES.map((l) => l.id));

// A second, separate "crawl" from the prediction ticker: real live scores
// for matches in progress right now, not model output. `live=all` returns
// every in-play fixture worldwide, so this filters down to leagues we
// actually track — a much shorter cache window than the rest of the
// client (30s, not 5min) since a live score going stale looks broken.
export async function getLiveFixtures(): Promise<LiveScore[]> {
  const fixtures = await afFetch<AFFixture[]>("/fixtures", { live: "all" }, 30);
  return fixtures
    .filter((f) => TRACKED_LEAGUE_IDS.has(f.league.id))
    .map((f) => ({
      fixtureId: f.fixture.id,
      homeName: f.teams.home.name,
      awayName: f.teams.away.name,
      homeGoals: f.goals.home ?? 0,
      awayGoals: f.goals.away ?? 0,
      elapsed: f.fixture.status.elapsed,
      statusShort: f.fixture.status.short,
    }));
}

export interface FixturesWindowResult {
  fixtures: AFFixture[];
  leagueErrors: { league: string; error: string }[];
}

export async function getFixturesInWindow(hoursAhead = 24): Promise<FixturesWindowResult> {
  const now = new Date();
  const to = new Date(now.getTime() + hoursAhead * 3600 * 1000);
  // API-Football's /fixtures takes whole dates, not datetimes — fetch the
  // (up to 2) covered calendar days and filter precisely by kickoff below.
  const fromDate = now.toISOString().slice(0, 10);
  const toDate = to.toISOString().slice(0, 10);
  const season = currentSeasonYear();

  // One league erroring (bad season guess, plan restriction, transient
  // API hiccup) used to throw out of throttledMap and abort the whole
  // batch, silently zeroing out every OTHER league that would have
  // worked fine — that's how the site ended up with zero fixtures despite
  // a full matchday elsewhere. Isolate each league's failure instead.
  const leagueErrors: { league: string; error: string }[] = [];
  const perLeague = await throttledMap(TRACKED_LEAGUES, 800, async (league) => {
    try {
      return await afFetch<AFFixture[]>("/fixtures", { league: league.id, season, from: fromDate, to: toDate, timezone: "UTC" });
    } catch (err) {
      leagueErrors.push({ league: league.name, error: err instanceof Error ? err.message : String(err) });
      return [];
    }
  });
  const fixtures = perLeague.flat().filter((f) => {
    const kickoff = new Date(f.fixture.date).getTime();
    return kickoff >= now.getTime() && kickoff <= to.getTime();
  });

  return { fixtures, leagueErrors };
}

export interface AFTeamStatistics {
  form: string; // e.g. "WWDLW", oldest -> most recent
  goals: {
    for: { average: { total: string } };
    against: { average: { total: string } };
  };
}

export async function getTeamStatistics(teamId: number, leagueId: number, season: number) {
  return afFetch<AFTeamStatistics>("/teams/statistics", { team: teamId, league: leagueId, season });
}

export interface AFStandingRow {
  rank: number;
  team: { id: number; name: string };
  points: number;
  goalsDiff: number;
  form: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
}

interface AFStandingsResponse {
  league: {
    id: number;
    name: string;
    country: string;
    season: number;
    standings: AFStandingRow[][];
  };
}

export async function getStandings(
  leagueId: number,
  season: number
): Promise<{ leagueMeta: AFStandingsResponse["league"] | undefined; rows: AFStandingRow[] }> {
  const response = await afFetch<AFStandingsResponse[]>("/standings", { league: leagueId, season });
  const leagueMeta = response[0]?.league;
  return { leagueMeta, rows: leagueMeta?.standings.flat() ?? [] };
}

export interface AFPlayer {
  player: { id: number; name: string };
  statistics: {
    games: { position: string; appearences: number | null };
    goals: { total: number | null };
  }[];
}

export async function getTeamPlayers(teamId: number, season: number): Promise<AFPlayer[]> {
  // Paginated; squads are small enough that page 1-2 covers all first-teamers.
  const page1 = await afFetch<AFPlayer[]>("/players", { team: teamId, season, page: 1 });
  return page1;
}

export interface AFInjury {
  player: { id: number };
  player_reason: string; // e.g. "Doubtful", "Injured"
}

export async function getInjuries(teamId: number, season: number): Promise<AFInjury[]> {
  return afFetch<AFInjury[]>("/injuries", { team: teamId, season });
}

// ---------------------------------------------------------------------------
// Mapping into the model's TeamStats shape
// ---------------------------------------------------------------------------

import type { FormResult, KeyPlayer, TeamStats } from "./model";

function parseForm(form: string | undefined): FormResult[] {
  if (!form) return [];
  return form
    .split("")
    .filter((c): c is FormResult => c === "W" || c === "D" || c === "L")
    .slice(-5);
}

function playerStatus(playerId: number, injuries: AFInjury[]): KeyPlayer["status"] {
  const injury = injuries.find((i) => i.player.id === playerId);
  if (!injury) return "fit";
  return /doubt/i.test(injury.player_reason) ? "doubtful" : "injured";
}

export async function buildTeamStats(params: {
  teamId: number;
  teamName: string;
  shortName: string;
  leagueId: number;
  season: number;
  standings: AFStandingRow[];
}): Promise<TeamStats> {
  const { teamId, teamName, shortName, leagueId, season, standings } = params;

  const stats = await getTeamStatistics(teamId, leagueId, season);
  await sleep(400);
  const players = await getTeamPlayers(teamId, season);
  await sleep(400);
  const injuries = await getInjuries(teamId, season);

  const leaguePos = standings.find((s) => s.team.id === teamId)?.rank ?? 10;

  const keyPlayers: KeyPlayer[] = players
    .map((p) => {
      const s = p.statistics[0];
      return {
        name: p.player.name,
        role: s?.games.position ?? "Midfielder",
        goals: s?.goals.total ?? 0,
        apps: s?.games.appearences ?? 1,
        status: playerStatus(p.player.id, injuries),
      };
    })
    .filter((p) => p.apps > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5);

  return {
    name: teamName,
    short: shortName,
    form: parseForm(stats.form),
    gf: [],
    ga: [],
    leaguePos,
    avgGoalsFor: parseFloat(stats.goals.for.average.total) || 1,
    avgGoalsAgainst: parseFloat(stats.goals.against.average.total) || 1,
    keyPlayers,
  };
}

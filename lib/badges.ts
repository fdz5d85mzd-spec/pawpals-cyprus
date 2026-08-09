export interface Badge {
  key: string;
  label: string;
  icon: "target" | "flame" | "trophy" | "medal" | "calendar" | "star";
}

// Pure, on-the-fly computation from data we already have (UserPick counts +
// User.createdAt) — no new table needed, so there's nothing to backfill and
// no risk of it drifting out of sync with the numbers shown elsewhere.
export function getBadges(params: { totalPicks: number; hitPicks: number; memberSince: Date }): Badge[] {
  const { totalPicks, hitPicks, memberSince } = params;
  const badges: Badge[] = [];
  const daysSinceMember = (Date.now() - memberSince.getTime()) / 86400000;

  if (totalPicks >= 1) badges.push({ key: "first-pick", label: "Πρώτη πρόβλεψη", icon: "target" });
  if (hitPicks >= 10) badges.push({ key: "ten-hits", label: "10 σωστές προβλέψεις", icon: "medal" });
  if (hitPicks >= 50) badges.push({ key: "fifty-hits", label: "50 σωστές προβλέψεις", icon: "trophy" });
  if (hitPicks >= 100) badges.push({ key: "hundred-hits", label: "100 σωστές προβλέψεις", icon: "trophy" });
  if (totalPicks >= 20 && hitPicks / totalPicks >= 0.6) badges.push({ key: "sharpshooter", label: "Σκοπευτής (60%+ σε 20+)", icon: "star" });
  if (daysSinceMember >= 90) badges.push({ key: "three-months", label: "3 μήνες μέλος", icon: "calendar" });
  if (daysSinceMember >= 365) badges.push({ key: "one-year", label: "1 χρόνος μέλος", icon: "calendar" });

  return badges;
}

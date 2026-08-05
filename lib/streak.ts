import { prisma } from "./db";

// "Current streak" = consecutive correct picks counting back from their
// most recently settled one — one miss anywhere in that run ends it.
// Badges only show for streak >= 3, so this only needs to look at settled
// picks (unsettled ones don't affect it either way).
export async function getStreaks(userIds: string[]): Promise<Map<string, number>> {
  if (userIds.length === 0) return new Map();

  const picks = await prisma.userPick.findMany({
    where: { userId: { in: userIds }, hit: { not: null } },
    include: { fixture: { select: { kickoff: true } } },
    orderBy: { fixture: { kickoff: "desc" } },
  });

  const byUser = new Map<string, typeof picks>();
  for (const p of picks) {
    const arr = byUser.get(p.userId) ?? [];
    arr.push(p);
    byUser.set(p.userId, arr);
  }

  const streaks = new Map<string, number>();
  for (const [userId, userPicks] of byUser) {
    let streak = 0;
    for (const p of userPicks) {
      if (!p.hit) break;
      streak++;
    }
    streaks.set(userId, streak);
  }
  return streaks;
}

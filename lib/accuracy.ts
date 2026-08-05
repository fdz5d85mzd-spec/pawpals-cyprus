import { prisma } from "./db";

// Shared by /history (full breakdown), the homepage trust badge (headline
// number only), and the weekly recap email (`since` window) so none of them
// can drift out of sync on the definition of "accuracy".
export async function getOverallAccuracy(since?: Date): Promise<{ total: number; correct: number; accuracy: number }> {
  const where = since ? { settledAt: { gte: since } } : undefined;
  const total = await prisma.predictionResult.count({ where });
  const correct = await prisma.predictionResult.count({ where: { ...where, hit: true } });
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { total, correct, accuracy };
}

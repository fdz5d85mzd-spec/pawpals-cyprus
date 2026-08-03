import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type Plan = "FREE" | "PRO";

export async function getCurrentPlan(): Promise<Plan> {
  const session = await getServerSession(authOptions);
  const plan = (session?.user as { plan?: string } | undefined)?.plan;
  return plan === "PRO" ? "PRO" : "FREE";
}

// Free preview: full 1X2 + top correct score for one line, everything else
// blurred/locked behind Pro — matches the brief's "limited preview" framing.
export const FREE_MARKETS = ["ONE_X_TWO"] as const;

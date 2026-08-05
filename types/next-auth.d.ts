import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      plan?: "FREE" | "PRO";
      trialEndsAt?: string | null;
      isAdmin?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    plan?: "FREE" | "PRO";
    trialEndsAt?: string | null;
    isAdmin?: boolean;
  }
}

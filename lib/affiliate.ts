import crypto from "crypto";

export const AFFILIATE_COOKIE = "skorama_aff";
export const AFFILIATE_COOKIE_MAX_AGE_DAYS = 30;
export const DEFAULT_COMMISSION_PERCENT = 20;

export function generateAffiliateCode(): string {
  return crypto.randomBytes(5).toString("hex").toUpperCase();
}

export function commissionCents(amountCents: number, commissionPercent: number): number {
  return Math.round((amountCents * commissionPercent) / 100);
}

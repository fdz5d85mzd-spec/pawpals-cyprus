import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getTikTokAuthorizeUrl } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "tiktok_oauth_state";

// Admin-only entry point: kicks off the TikTok OAuth consent flow. The
// random `state` is stashed in a short-lived cookie so the callback can
// confirm the redirect it's handling actually came from a request we made
// (basic CSRF protection for the OAuth dance).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = crypto.randomBytes(16).toString("hex");
  const res = NextResponse.redirect(getTikTokAuthorizeUrl(state));
  res.cookies.set(STATE_COOKIE, state, { httpOnly: true, secure: true, maxAge: 600, path: "/" });
  return res;
}

import { NextRequest, NextResponse } from "next/server";
import { exchangeTikTokCode } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "tiktok_oauth_state";

// TikTok redirects here after the user approves (or denies) the consent
// screen started by /api/tiktok/authorize. No admin check needed here —
// the state-cookie match is what proves this belongs to a login we
// actually initiated, not an arbitrary caller hitting this URL.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");
  const expectedState = req.cookies.get(STATE_COOKIE)?.value;

  const redirectTo = (status: string) => {
    const url = new URL("/admin", process.env.NEXT_PUBLIC_APP_URL);
    url.searchParams.set("tiktok", status);
    return NextResponse.redirect(url);
  };

  if (error) return redirectTo(`error_${error}`);
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectTo("error_invalid_state");
  }

  try {
    await exchangeTikTokCode(code);
    const res = redirectTo("connected");
    res.cookies.delete(STATE_COOKIE);
    return res;
  } catch (err) {
    console.error("tiktok callback failed", err);
    return redirectTo("error_exchange_failed");
  }
}

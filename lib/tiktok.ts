import { prisma } from "@/lib/db";

const AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const CONTENT_INIT_URL = "https://open.tiktokapis.com/v2/post/publish/content/init/";

function getRedirectUri(): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/tiktok/callback`;
}

export function getTikTokAuthorizeUrl(state: string): string {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  if (!clientKey) throw new Error("TIKTOK_CLIENT_KEY not set");

  const params = new URLSearchParams({
    client_key: clientKey,
    // video.publish (Direct Post) needs a separate, stricter TikTok review
    // beyond just adding the Content Posting API product — until that's
    // granted, video.upload (draft-to-inbox) is what's actually available.
    scope: "user.info.basic,video.upload",
    response_type: "code",
    redirect_uri: getRedirectUri(),
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

interface TikTokTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  refresh_expires_in: number; // seconds
  open_id: string;
  error?: string;
  error_description?: string;
}

async function storeTokens(data: TikTokTokenResponse) {
  const now = Date.now();
  await prisma.tikTokAuth.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      openId: data.open_id,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      accessExpiresAt: new Date(now + data.expires_in * 1000),
      refreshExpiresAt: new Date(now + data.refresh_expires_in * 1000),
    },
    update: {
      openId: data.open_id,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      accessExpiresAt: new Date(now + data.expires_in * 1000),
      refreshExpiresAt: new Date(now + data.refresh_expires_in * 1000),
    },
  });
}

export async function exchangeTikTokCode(code: string): Promise<void> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) throw new Error("TikTok not configured");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: getRedirectUri(),
    }),
  });
  const data: TikTokTokenResponse = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error_description ?? `TikTok token exchange failed (${res.status})`);
  }
  await storeTokens(data);
}

// Refreshes if the access token is missing or within 1h of expiring —
// called both by the periodic cron and lazily before any post, so posting
// never fails just because the cron hasn't run recently enough.
export async function getValidTikTokAccessToken(): Promise<string> {
  const auth = await prisma.tikTokAuth.findUnique({ where: { id: "singleton" } });
  if (!auth) throw new Error("TikTok account not connected yet");

  const oneHour = 60 * 60 * 1000;
  if (auth.accessExpiresAt.getTime() - Date.now() > oneHour) {
    return auth.accessToken;
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) throw new Error("TikTok not configured");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: auth.refreshToken,
    }),
  });
  const data: TikTokTokenResponse = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error_description ?? `TikTok token refresh failed (${res.status})`);
  }
  await storeTokens(data);
  return data.access_token;
}

// Posts a single image via the Content Posting API (photo mode, draft
// upload). The app only has the video.upload scope right now, not
// video.publish — TikTok gates true one-step Direct Post behind a
// separate, stricter review beyond just adding the Content Posting API
// product. MEDIA_UPLOAD sends it to the connected account's TikTok inbox
// as a draft; a person still has to open the app and tap Post to finish.
// Switch post_mode to "DIRECT_POST" (and add post_info.privacy_level etc.)
// once that capability is granted.
export async function postPhotoToTikTok(input: { imageUrl: string; caption: string }): Promise<{ publishId: string }> {
  const accessToken = await getValidTikTokAccessToken();

  const res = await fetch(CONTENT_INIT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({
      post_info: {
        title: input.caption,
      },
      source_info: {
        source: "PULL_FROM_URL",
        photo_cover_index: 0,
        photo_images: [input.imageUrl],
      },
      post_mode: "MEDIA_UPLOAD",
      media_type: "PHOTO",
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error?.code !== "ok") {
    throw new Error(data.error?.message ?? `TikTok post failed (${res.status})`);
  }
  return { publishId: data.data.publish_id };
}

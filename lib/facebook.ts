const GRAPH_VERSION = "v21.0";

// Text-only post to the Page's feed via the Graph API. Needs a long-lived
// Page Access Token with pages_manage_posts (+ pages_read_engagement)
// permission — see the setup notes in app/api/cron/social-post/route.ts.
export async function postToFacebookPage(message: string): Promise<{ id: string }> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!pageId || !accessToken) {
    throw new Error("Facebook not configured (FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN missing)");
  }

  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ message, access_token: accessToken }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Facebook post failed (${res.status})`);
  }
  return { id: data.id };
}

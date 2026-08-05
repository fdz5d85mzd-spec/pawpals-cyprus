import { NextResponse } from "next/server";

// Google requires ads.txt at the domain root listing every publisher ID
// allowed to sell ad inventory on this site — without it, AdSense refuses
// to serve. Uses the same publisher ID as the adsbygoogle script (see
// AdsenseScript.tsx) so there's only one place to configure it.
export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID; // e.g. "ca-pub-1234567890123456"
  if (!clientId) return new NextResponse("", { status: 404 });

  const pubId = clientId.replace(/^ca-/, ""); // ads.txt wants "pub-...", not "ca-pub-..."
  return new NextResponse(`google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Content-Type": "text/plain" },
  });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { postPhotoToTikTok } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

// Admin-only manual trigger: posts one test photo to the connected TikTok
// account (SELF_ONLY visibility, since the app is unaudited). Exists so the
// review demo video has something concrete to record — the real automated
// posting pipeline (mirroring lib/social-copy.ts) comes after the app
// passes TikTok's review.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await postPhotoToTikTok({
      imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/icon-512`,
      caption: "Skorama — Στατιστικές προβλέψεις ποδοσφαίρου 📊⚽ #Skorama #Ποδόσφαιρο",
    });
    return NextResponse.json({ ok: true, publishId: result.publishId });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "TikTok post failed" }, { status: 500 });
  }
}

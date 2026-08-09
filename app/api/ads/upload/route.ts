import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadAdMedia, AdUploadError } from "@/lib/ad-upload";

export const dynamic = "force-dynamic";

// Self-serve upload for advertisers submitting their own ad creative —
// any signed-in user, not just admins (see /api/admin/upload for that).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });

  try {
    return NextResponse.json(await uploadAdMedia(file, "ad-submissions"));
  } catch (err) {
    const status = err instanceof AdUploadError ? err.status : 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status });
  }
}

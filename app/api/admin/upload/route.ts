import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB — covers a short looping ad clip, not a full video file
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "video/mp4", "video/webm"];

// Admin-only upload for ad-box media (image or short video) — stored on
// Vercel Blob so admins aren't limited to pasting an already-hosted URL.
// Requires a Blob store connected to the project (Vercel → Storage →
// Create Database → Blob), which auto-injects BLOB_READ_WRITE_TOKEN.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
  }
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 400 });

  try {
    const blob = await put(`ad-banners/${Date.now()}-${file.name}`, file, {
      access: "public",
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url, isVideo: file.type.startsWith("video/") });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed — is Blob storage connected to this project?" },
      { status: 500 }
    );
  }
}

import { put } from "@vercel/blob";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB — covers a short looping ad clip, not a full video file
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "video/mp4", "video/webm"];

export class AdUploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// Shared by the admin ad-banner upload route and the self-serve advertiser
// upload route — same Vercel Blob storage, same size/type limits, just
// different folders and different auth checks at the call site.
export async function uploadAdMedia(file: File, folder: string): Promise<{ url: string; isVideo: boolean }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new AdUploadError(`Unsupported file type: ${file.type}`);
  }
  if (file.size > MAX_BYTES) {
    throw new AdUploadError("File too large (max 25MB)");
  }

  try {
    const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, {
      access: "public",
      contentType: file.type,
    });
    return { url: blob.url, isVideo: file.type.startsWith("video/") };
  } catch (err) {
    throw new AdUploadError(
      err instanceof Error ? err.message : "Upload failed — is Blob storage connected to this project?",
      500
    );
  }
}

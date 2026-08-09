"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2, X, Upload } from "lucide-react";

interface Banner {
  position: number;
  imageUrl: string;
  linkUrl: string;
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

// Fixed-size grid of sponsor/ad boxes for otherwise-empty layout space.
// Visitors see only the filled boxes (or nothing, if none are set yet);
// the admin additionally sees empty slots as "+ add" placeholders and can
// edit/delete existing ones inline, without leaving the page. Media can
// either be pasted as an already-hosted URL or uploaded directly (image or
// short video) — uploads go to Vercel Blob via /api/admin/upload.
export function AdSlotBoxes({ slotKey, count = 3, initialBanners }: { slotKey: string; count?: number; initialBanners: Banner[] }) {
  const { data: session } = useSession();
  const isAdmin = !!session?.user?.isAdmin;
  const [banners, setBanners] = useState(initialBanners);
  const [editing, setEditing] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function startEdit(position: number) {
    const existing = banners.find((b) => b.position === position);
    setImageUrl(existing?.imageUrl ?? "");
    setLinkUrl(existing?.linkUrl ?? "");
    setUploadError(null);
    setEditing(position);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Το upload απέτυχε");
        return;
      }
      setImageUrl(data.url);
    } catch {
      setUploadError("Το upload απέτυχε");
    } finally {
      setUploading(false);
    }
  }

  async function save(position: number) {
    if (!imageUrl.trim() || !linkUrl.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ad-banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotKey, position, imageUrl: imageUrl.trim(), linkUrl: linkUrl.trim() }),
      });
      if (!res.ok) return;
      setBanners((prev) => [...prev.filter((b) => b.position !== position), { position, imageUrl: imageUrl.trim(), linkUrl: linkUrl.trim() }]);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function remove(position: number) {
    await fetch("/api/admin/ad-banners", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotKey, position }),
    });
    setBanners((prev) => prev.filter((b) => b.position !== position));
  }

  const positions = Array.from({ length: count }, (_, i) => i);
  const visiblePositions = isAdmin ? positions : positions.filter((p) => banners.some((b) => b.position === p));
  if (visiblePositions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-2">
      {visiblePositions.map((position) => {
        const banner = banners.find((b) => b.position === position);

        if (editing === position) {
          return (
            <div key={position} className="card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wide font-mono text-dim">Διαφήμιση #{position + 1}</span>
                <button onClick={() => setEditing(null)} className="text-dim hover:text-ink">
                  <X size={14} />
                </button>
              </div>

              {imageUrl && (
                <div className="rounded overflow-hidden border border-border">
                  {isVideoUrl(imageUrl) ? (
                    <video src={imageUrl} className="w-full h-auto block" muted loop autoPlay playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="" className="w-full h-auto block" />
                  )}
                </div>
              )}

              <label className="flex items-center justify-center gap-1.5 border border-dashed border-border rounded px-2 py-2 text-[11px] text-dim hover:text-lime hover:border-lime/50 cursor-pointer transition-colors">
                <Upload size={12} />
                {uploading ? "Ανεβαίνει..." : "Ανέβασμα εικόνας/video"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
                />
              </label>
              {uploadError && <p className="text-[10px] text-rose">{uploadError}</p>}

              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="...ή URL εικόνας/video"
                className="w-full text-xs bg-surface2 border border-border rounded px-2 py-1.5 text-ink"
              />
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="URL προορισμού (πού θα οδηγεί το κλικ)"
                className="w-full text-xs bg-surface2 border border-border rounded px-2 py-1.5 text-ink"
              />
              <button onClick={() => save(position)} disabled={saving || uploading} className="btn-primary w-full !py-1.5 text-xs">
                {saving ? "..." : "Αποθήκευση"}
              </button>
            </div>
          );
        }

        if (!banner) {
          return (
            <button
              key={position}
              onClick={() => startEdit(position)}
              className="card border-dashed border-2 border-border/60 hover:border-lime/50 flex flex-col items-center justify-center gap-1.5 py-8 text-dim hover:text-lime transition-colors"
            >
              <Plus size={18} />
              <span className="text-[10px] uppercase tracking-wide font-mono">Προσθήκη διαφήμισης</span>
            </button>
          );
        }

        return (
          <div key={position} className="card relative overflow-hidden group">
            <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer sponsored" className="block">
              {isVideoUrl(banner.imageUrl) ? (
                <video src={banner.imageUrl} className="w-full h-auto block" muted loop autoPlay playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={banner.imageUrl} alt="" className="w-full h-auto block" />
              )}
            </a>
            {isAdmin && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(position)} className="bg-bg/90 border border-border rounded p-1.5 text-ink hover:text-lime">
                  <Pencil size={12} />
                </button>
                <button onClick={() => remove(position)} className="bg-bg/90 border border-border rounded p-1.5 text-ink hover:text-rose">
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

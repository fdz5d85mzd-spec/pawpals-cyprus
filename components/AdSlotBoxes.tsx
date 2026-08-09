"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2, X, Upload, Megaphone, Clock } from "lucide-react";

interface Banner {
  position: number;
  imageUrl: string;
  linkUrl: string;
}

interface SlotClaim {
  position: number;
  status: "AWAITING_PAYMENT" | "PENDING_APPROVAL";
  mine: boolean;
}

const AD_SLOT_MONTHLY_EUR = 100;

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

// Fixed-size grid of sponsor/ad boxes for otherwise-empty layout space.
//
// Three audiences see three different things per empty box:
// - Admin: the original direct "+ add" editor (paste/upload straight in,
//   no payment) — unchanged from before.
// - A visitor whose own submission is already PENDING_APPROVAL or blocked
//   by someone else's in-flight submission: nothing, or a waiting card.
// - Everyone else: "Διαφημιστείτε εδώ" — a self-serve form that uploads
//   their own creative, takes payment first (100€/month via Stripe), and
//   only goes live once an admin approves it (see /api/ads/submit and the
//   admin ad-submissions review panel).
export function AdSlotBoxes({
  slotKey,
  count = 3,
  initialBanners,
}: {
  slotKey: string;
  count?: number;
  initialBanners: Banner[];
}) {
  const { data: session } = useSession();
  const isAdmin = !!session?.user?.isAdmin;
  const isSignedIn = !!session?.user?.id;
  const [banners, setBanners] = useState(initialBanners);
  const [claims, setClaims] = useState<SlotClaim[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [applying, setApplying] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [autoRenew, setAutoRenew] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetched separately from the (ISR-cached, non-personalized) page props
  // so which slots are claimed/pending-for-me can update per-viewer without
  // making the whole page dynamic. Admins never need this — they always see
  // every empty box as their own direct "+ add" editor.
  useEffect(() => {
    if (isAdmin) return;
    fetch(`/api/ads/claims?slotKey=${encodeURIComponent(slotKey)}`)
      .then((r) => r.json())
      .then((d) => setClaims(d.claims ?? []))
      .catch(() => {});
  }, [slotKey, isAdmin]);

  function startEdit(position: number) {
    const existing = banners.find((b) => b.position === position);
    setImageUrl(existing?.imageUrl ?? "");
    setLinkUrl(existing?.linkUrl ?? "");
    setUploadError(null);
    setEditing(position);
  }

  function startApply(position: number) {
    setImageUrl("");
    setLinkUrl("");
    setAutoRenew(true);
    setUploadError(null);
    setSubmitError(null);
    setApplying(position);
  }

  async function uploadFile(file: File, endpoint: string) {
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(endpoint, { method: "POST", body: form });
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

  async function submitApplication(position: number) {
    if (!imageUrl.trim() || !linkUrl.trim()) {
      setSubmitError("Χρειάζεται εικόνα/video και link.");
      return;
    }
    let normalizedLink = linkUrl.trim();
    if (!/^https?:\/\//i.test(normalizedLink)) normalizedLink = `https://${normalizedLink}`;

    setSaving(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/ads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotKey, position, imageUrl: imageUrl.trim(), linkUrl: normalizedLink, autoRenew }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setSubmitError(data.error ?? "Κάτι πήγε στραβά, δοκίμασε ξανά.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setSubmitError("Κάτι πήγε στραβά, δοκίμασε ξανά.");
    } finally {
      setSaving(false);
    }
  }

  const positions = Array.from({ length: count }, (_, i) => i);
  const claimedByOther = new Set(claims.filter((c) => !c.mine).map((c) => c.position));
  const myPendingApproval = new Set(claims.filter((c) => c.mine && c.status === "PENDING_APPROVAL").map((c) => c.position));

  // A filled box always shows; an empty one is hidden only while someone
  // else's submission has it claimed — everyone else (including admin, who
  // never has entries in `claims`) sees an open box as either the
  // "Διαφημιστείτε εδώ" CTA or the admin's own "+ add" editor.
  const visiblePositions = positions.filter((p) => banners.some((b) => b.position === p) || !claimedByOther.has(p));
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
                  onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "/api/admin/upload")}
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

        if (applying === position) {
          return (
            <div key={position} className="card p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wide font-mono text-lime">Διαφημιστείτε εδώ</span>
                <button onClick={() => setApplying(null)} className="text-dim hover:text-ink">
                  <X size={14} />
                </button>
              </div>

              <ol className="text-[11px] text-muted space-y-1.5 list-decimal list-inside">
                <li>Ανέβασε τη φωτογραφία ή το βίντεο της διαφήμισής σου.</li>
                <li>Βάλε το link όπου θα οδηγεί το κλικ.</li>
                <li>Επίλεξε αν θέλεις αυτόματη ανανέωση κάθε μήνα.</li>
                <li>Πλήρωσε {AD_SLOT_MONTHLY_EUR}€ — η πληρωμή γίνεται πρώτα.</li>
                <li>Μόλις πληρωθεί, η διαφήμιση περνάει σε έλεγχο και ενεργοποιείται μόλις εγκριθεί από εμάς.</li>
              </ol>

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
                {uploading ? "Ανεβαίνει..." : "1. Ανέβασμα εικόνας/video"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "/api/ads/upload")}
                />
              </label>
              {uploadError && <p className="text-[10px] text-rose">{uploadError}</p>}

              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="2. Link προορισμού (π.χ. https://το-site-σου.gr)"
                className="w-full text-xs bg-surface2 border border-border rounded px-2 py-1.5 text-ink"
              />

              <label className="flex items-center gap-2 text-[11px] text-muted">
                <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} className="accent-lime" />
                3. Αυτόματη ανανέωση κάθε μήνα
              </label>

              {submitError && <p className="text-[10px] text-rose">{submitError}</p>}

              <button
                onClick={() => submitApplication(position)}
                disabled={saving || uploading}
                className="btn-primary w-full !py-1.5 text-xs"
              >
                {saving ? "..." : `4. Πληρωμή ${AD_SLOT_MONTHLY_EUR}€/μήνα & Υποβολή`}
              </button>
            </div>
          );
        }

        if (!banner) {
          if (isAdmin) {
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

          if (myPendingApproval.has(position)) {
            return (
              <div
                key={position}
                className="card border-dashed border-2 border-amber/40 flex flex-col items-center justify-center gap-1.5 py-8 text-amber"
              >
                <Clock size={18} />
                <span className="text-[10px] uppercase tracking-wide font-mono text-center px-2">
                  Η διαφήμισή σου εστάλη — αναμονή έγκρισης
                </span>
              </div>
            );
          }

          return (
            <button
              key={position}
              onClick={() => (isSignedIn ? startApply(position) : (window.location.href = "/login"))}
              className="card border-dashed border-2 border-border/60 hover:border-lime/50 flex flex-col items-center justify-center gap-1.5 py-8 text-dim hover:text-lime transition-colors"
            >
              <Megaphone size={18} />
              <span className="text-[10px] uppercase tracking-wide font-mono">Διαφημιστείτε εδώ</span>
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

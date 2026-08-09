"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Link2 } from "lucide-react";

function StatusBanner() {
  const params = useSearchParams();
  const status = params.get("tiktok");
  if (!status) return null;

  if (status === "connected") {
    return <div className="mb-3 text-xs text-lime bg-lime/10 border border-lime/30 rounded px-3 py-2">Το TikTok συνδέθηκε επιτυχώς.</div>;
  }
  return (
    <div className="mb-3 text-xs text-rose bg-rose/10 border border-rose/30 rounded px-3 py-2">
      Η σύνδεση με το TikTok απέτυχε ({status}). Δοκίμασε ξανά.
    </div>
  );
}

export function TikTokConnectionCard({ connected }: { connected: boolean }) {
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function testPost() {
    setPosting(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/tiktok-test-post", { method: "POST" });
      const data = await res.json();
      setResult(res.ok ? `Στάλθηκε! (publish id: ${data.publishId})` : `Αποτυχία: ${data.error}`);
    } catch {
      setResult("Αποτυχία: κάτι πήγε στραβά.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="card p-4">
      <Suspense fallback={null}>
        <StatusBanner />
      </Suspense>
      <div className="flex items-center gap-2 mb-3">
        {connected ? <CheckCircle2 size={14} className="text-lime" /> : <Link2 size={14} className="text-dim" />}
        <span className="text-xs font-bold text-ink">{connected ? "Συνδεδεμένο με TikTok" : "Δεν είναι συνδεδεμένο ακόμα"}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {/* Hard navigation on purpose — this is an API route that 302s to
            TikTok's consent screen, not a Next.js page. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/api/tiktok/authorize" className="btn-secondary !py-1.5 text-xs">
          {connected ? "Επανασύνδεση" : "Σύνδεση με TikTok"}
        </a>
        {connected && (
          <button onClick={testPost} disabled={posting} className="btn-primary !py-1.5 text-xs">
            {posting ? "..." : "Δοκιμαστικό Post"}
          </button>
        )}
      </div>
      {result && <p className="text-[11px] text-muted mt-2">{result}</p>}
      <p className="text-[10px] text-dim mt-3 leading-relaxed">
        Το post στέλνεται σαν πρόχειρο (draft) στην εφαρμογή TikTok — χρειάζεται να ανοίξεις το κινητό και να πατήσεις
        &ldquo;Post&rdquo; για να δημοσιευτεί. Πλήρως αυτόματο posting θα ενεργοποιηθεί μόλις εγκριθεί το &ldquo;Direct
        Post&rdquo; από την TikTok.
      </p>
    </div>
  );
}

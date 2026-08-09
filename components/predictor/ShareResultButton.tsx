"use client";

import { Share2 } from "lucide-react";

export function ShareResultButton({ text, url }: { text: string; url: string }) {
  async function share() {
    const fullUrl = `${window.location.origin}${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ text, url: fullUrl });
      } catch {
        // user cancelled the native share sheet — not an error
      }
      return;
    }
    await navigator.clipboard.writeText(`${text} ${fullUrl}`);
    alert("Αντιγράφηκε στο clipboard!");
  }

  return (
    <button onClick={share} className="btn-secondary inline-flex items-center gap-1.5 !py-1.5 text-xs">
      <Share2 size={13} />
      Κοινοποίηση
    </button>
  );
}

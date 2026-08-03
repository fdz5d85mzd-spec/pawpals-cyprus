"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function Nav() {
  const { data: session } = useSession();

  return (
    <div className="max-w-xl mx-auto px-5 pt-6 flex items-center justify-between gap-2">
      <div className="flex gap-2">
        <Link
          href="/"
          className="text-xs font-mono px-3 py-1.5 rounded-full border border-border text-muted hover:text-ink"
        >
          Σήμερα
        </Link>
        <Link
          href="/history"
          className="text-xs font-mono px-3 py-1.5 rounded-full border border-border text-muted hover:text-ink"
        >
          Ιστορικό &amp; Ακρίβεια
        </Link>
        <Link
          href="/pricing"
          className="text-xs font-mono px-3 py-1.5 rounded-full border border-border text-muted hover:text-ink"
        >
          Τιμές
        </Link>
      </div>
      <div className="text-xs font-mono">
        {session ? (
          <button onClick={() => signOut()} className="text-muted hover:text-ink">
            Αποσύνδεση
          </button>
        ) : (
          <Link href="/login" className="text-lime font-bold">
            Σύνδεση
          </Link>
        )}
      </div>
    </div>
  );
}

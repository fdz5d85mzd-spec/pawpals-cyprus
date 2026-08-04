"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const LINKS = [
  { href: "/", label: "Σήμερα" },
  { href: "/history", label: "Ιστορικό" },
  { href: "/reviews", label: "Κριτικές" },
  { href: "/pricing", label: "Τιμές" },
];

export function Nav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-lime bg-bg">
      <div className="max-w-xl mx-auto px-5 h-14 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="w-7 h-7 bg-lime text-bg font-display font-extrabold text-sm flex items-center justify-center">
            S
          </span>
          <span className="font-display font-extrabold text-sm text-ink tracking-tight uppercase">Skorama</span>
        </Link>

        <nav className="flex items-center gap-3 overflow-x-auto scrollbar-none">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`text-[11px] font-bold uppercase tracking-wide px-1 py-1.5 whitespace-nowrap border-b-2 transition-colors ${
                  active ? "text-lime border-lime" : "text-muted border-transparent hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="text-xs font-mono shrink-0">
          {session ? (
            <button onClick={() => signOut()} className="text-muted hover:text-rose transition-colors">
              Έξοδος
            </button>
          ) : (
            <Link href="/login" className="btn-primary !px-3 !py-1.5">
              Σύνδεση
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

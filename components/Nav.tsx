"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "/", label: "Σήμερα" },
  { href: "/standings", label: "Βαθμολογίες" },
  { href: "/history", label: "Ιστορικό" },
  { href: "/reviews", label: "Κριτικές" },
  { href: "/pricing", label: "Τιμές" },
];

export function Nav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-lime bg-bg">
      <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
          <span className="w-7 h-7 bg-lime text-bg font-display font-extrabold text-sm flex items-center justify-center">
            S
          </span>
          <span className="font-display font-extrabold text-sm text-ink tracking-tight uppercase">Skorama</span>
        </Link>

        {/* Phones don't have room for 5 links + logo + button on one line —
            this collapses into a dropdown below `sm` instead of fighting for
            space with horizontal scroll (which just reads as broken). */}
        <nav className="hidden sm:flex items-center gap-4">
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

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:block text-xs font-mono">
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

          <button
            onClick={() => setOpen((v) => !v)}
            className="sm:hidden text-ink p-1"
            aria-label={open ? "Κλείσιμο μενού" : "Άνοιγμα μενού"}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="sm:hidden border-t border-border/60 bg-bg px-5 py-3 flex flex-col">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`text-sm font-bold uppercase tracking-wide py-3 border-b border-border/40 last:border-0 ${
                  active ? "text-lime" : "text-muted"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <div className="pt-3 mt-1">
            {session ? (
              <button
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
                className="text-sm font-bold uppercase tracking-wide text-muted hover:text-rose transition-colors"
              >
                Έξοδος
              </button>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className="btn-primary inline-block !px-4 !py-2 text-sm">
                Σύνδεση
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

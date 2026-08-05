"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function Nav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const t = useTranslations("nav");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  // /live is a bare OBS browser-source overlay — no site chrome around it.
  if (pathname === "/live") return null;

  const LINKS = [
    { href: "/", label: t("today") },
    { href: "/standings", label: t("standings") },
    { href: "/history", label: t("history") },
    { href: "/reviews", label: t("reviews") },
    { href: "/pricing", label: t("pricing") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b-2 border-lime bg-bg">
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-3">
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
          <div className="hidden sm:flex items-center gap-3">
            <LanguageSwitcher locale={locale} pathname={pathname} />
            <div className="text-xs font-mono">
              {session ? (
                <button onClick={() => signOut()} className="text-muted hover:text-rose transition-colors">
                  {t("logout")}
                </button>
              ) : (
                <Link href="/login" className="btn-primary !px-3 !py-1.5">
                  {t("login")}
                </Link>
              )}
            </div>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="sm:hidden text-ink p-1"
            aria-label={open ? t("closeMenu") : t("openMenu")}
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
          <div className="flex items-center justify-between pt-3 mt-1">
            {session ? (
              <button
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
                className="text-sm font-bold uppercase tracking-wide text-muted hover:text-rose transition-colors"
              >
                {t("logout")}
              </button>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className="btn-primary inline-block !px-4 !py-2 text-sm">
                {t("login")}
              </Link>
            )}
            <LanguageSwitcher locale={locale} pathname={pathname} />
          </div>
        </nav>
      )}
    </header>
  );

  // Kept local to Nav — it's the only place a language switcher shows.
  function LanguageSwitcher({ locale: current, pathname: path }: { locale: string; pathname: string }) {
    return (
      <div className="flex items-center gap-1 text-[10px] font-mono font-bold">
        {routing.locales.map((loc) => (
          <Link
            key={loc}
            href={path}
            locale={loc}
            className={`px-1.5 py-1 uppercase transition-colors ${
              loc === current ? "text-lime" : "text-dim hover:text-ink"
            }`}
          >
            {loc}
          </Link>
        ))}
      </div>
    );
  }
}

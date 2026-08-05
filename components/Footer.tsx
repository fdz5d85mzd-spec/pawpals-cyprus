"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const pathname = usePathname();

  // /live is a bare OBS browser-source overlay — no site chrome around it.
  if (pathname === "/live") return null;

  const COLUMNS = [
    {
      title: t("product"),
      links: [
        { href: "/", label: nav("today") },
        { href: "/history", label: t("accuracyHistory") },
        { href: "/on-this-day", label: t("onThisDay") },
        { href: "/pricing", label: nav("pricing") },
      ],
    },
    {
      title: t("community"),
      links: [
        { href: "/reviews", label: nav("reviews") },
        { href: "/suggestions", label: t("suggestions") },
        { href: "/help", label: t("support") },
      ],
    },
    {
      title: t("legal"),
      links: [{ href: "/terms", label: t("terms") }],
    },
  ] as const;

  return (
    <footer className="mt-16 border-t border-border/60 bg-fade-surface">
      <div className="max-w-6xl mx-auto px-5 py-10">
        <div className="grid grid-cols-3 gap-4 md:gap-12 mb-8 md:max-w-xl">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-[9px] uppercase tracking-[0.15em] font-mono text-dim mb-3">{col.title}</div>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[11px] text-muted hover:text-lime transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-6 border-t border-border/60">
          <span className="w-5 h-5 rounded-md bg-lime text-bg font-display font-extrabold text-[10px] flex items-center justify-center">
            S
          </span>
          <span className="text-[10px] text-dim font-mono">
            Skorama © {new Date().getFullYear()} · {t("tagline")}
          </span>
        </div>
      </div>
    </footer>
  );
}

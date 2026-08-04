import Link from "next/link";

const COLUMNS = [
  {
    title: "Προϊόν",
    links: [
      { href: "/", label: "Σήμερα" },
      { href: "/history", label: "Ιστορικό & Ακρίβεια" },
      { href: "/pricing", label: "Τιμές" },
    ],
  },
  {
    title: "Κοινότητα",
    links: [
      { href: "/reviews", label: "Αξιολογήσεις" },
      { href: "/suggestions", label: "Εισηγήσεις" },
      { href: "/help", label: "Υποστήριξη" },
    ],
  },
  {
    title: "Νομικά",
    links: [{ href: "/terms", label: "Όροι Χρήσης" }],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-fade-surface">
      <div className="max-w-xl mx-auto px-5 py-10">
        <div className="grid grid-cols-3 gap-4 mb-8">
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
            Skorama © {new Date().getFullYear()} · Εργαλείο στατιστικής ανάλυσης, όχι υπηρεσία στοιχηματισμού.
          </span>
        </div>
      </div>
    </footer>
  );
}

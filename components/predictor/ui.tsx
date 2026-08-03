import type { FormResult } from "@/lib/model";

export function FormPill({ r }: { r: FormResult }) {
  const cls =
    r === "W" ? "bg-lime text-bg" : r === "D" ? "bg-dim text-bg" : "bg-[#E0665A] text-bg";
  return (
    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${cls}`}>
      {r}
    </span>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] tracking-[0.18em] uppercase font-mono mb-2 text-dim">{children}</div>;
}

export function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1 text-muted">
        <span>{label}</span>
        <span className="font-mono font-bold text-ink">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface2">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl py-3 px-3 bg-surface border border-border">
      <div className="text-[9px] uppercase tracking-wide font-mono mb-1 text-dim">{label}</div>
      <div className="text-base font-bold font-mono text-lime">{value}</div>
      {sub && <div className="text-[10px] mt-0.5 text-muted">{sub}</div>}
    </div>
  );
}

export function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg mb-1.5 bg-surface">
      <div>
        <div className="text-xs font-medium text-ink">{label}</div>
        {sub && <div className="text-[10px] mt-0.5 text-muted">{sub}</div>}
      </div>
      <div className="text-sm font-bold font-mono text-lime">{value}</div>
    </div>
  );
}

// Wraps Pro-only sections: renders children normally on Pro, or a blurred
// teaser + upgrade CTA on Free. Matches the brief's "Free = limited preview".
export function ProGate({ isPro, children }: { isPro: boolean; children: React.ReactNode }) {
  if (isPro) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-60">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <a
          href="/pricing"
          className="text-xs font-mono font-bold px-4 py-2 rounded-full bg-lime text-bg"
        >
          Ξεκλείδωσε με Pro
        </a>
      </div>
    </div>
  );
}

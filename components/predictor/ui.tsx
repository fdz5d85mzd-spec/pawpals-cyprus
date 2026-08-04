import type { FormResult } from "@/lib/model";
import { Link } from "@/i18n/navigation";

export function FormPill({ r }: { r: FormResult }) {
  const cls =
    r === "W"
      ? "bg-lime text-bg shadow-[0_0_10px_rgba(255,200,0,0.5)]"
      : r === "D"
      ? "bg-surface3 text-muted border border-border"
      : "bg-rose/90 text-bg";
  return (
    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-transform hover:scale-110 ${cls}`}>
      {r}
    </span>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase font-mono mb-2.5 text-dim">
      <span className="h-px w-3 bg-dim/60" />
      {children}
    </div>
  );
}

export function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-3.5">
      <div className="flex justify-between text-xs mb-1.5 text-muted">
        <span>{label}</span>
        <span className="font-mono font-bold text-ink">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface2 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }}
        />
      </div>
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-3.5">
      <div className="text-[9px] uppercase tracking-wide font-mono mb-1.5 text-dim">{label}</div>
      <div className="text-lg font-bold font-mono text-gradient">{value}</div>
      {sub && <div className="text-[10px] mt-1 text-muted">{sub}</div>}
    </div>
  );
}

export function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card-interactive flex items-center justify-between py-3 px-4 mb-2">
      <div>
        <div className="text-xs font-medium text-ink">{label}</div>
        {sub && <div className="text-[10px] mt-0.5 text-muted">{sub}</div>}
      </div>
      <div className="text-sm font-bold font-mono text-lime shrink-0 ml-3">{value}</div>
    </div>
  );
}

// Wraps Pro-only sections: renders children normally on Pro, or a blurred
// teaser + upgrade CTA on Free. Matches the brief's "Free = limited preview".
export function ProGate({ isPro, children }: { isPro: boolean; children: React.ReactNode }) {
  if (isPro) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[3px] opacity-50">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-bg/40 to-bg/80">
        <Link href="/pricing" className="btn-primary">
          Ξεκλείδωσε με Pro
        </Link>
      </div>
    </div>
  );
}

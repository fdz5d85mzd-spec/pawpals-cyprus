"use client";

import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";

interface PromoCode {
  code: string;
  durationDays: number | null;
  redeemedAt: string | null;
  redeemedBy: { email: string } | null;
}

type DurationUnit = "days" | "months" | "years" | "lifetime";

const UNIT_TO_DAYS: Record<Exclude<DurationUnit, "lifetime">, number> = { days: 1, months: 30, years: 365 };

function durationLabel(durationDays: number | null): string {
  if (durationDays == null) return "Lifetime";
  if (durationDays % 365 === 0) return `${durationDays / 365} έτος/η`;
  if (durationDays % 30 === 0) return `${durationDays / 30} μήνες`;
  return `${durationDays} μέρες`;
}

function daysRemaining(redeemedAt: string, durationDays: number | null): string {
  if (durationDays == null) return "Lifetime";
  const expires = new Date(redeemedAt).getTime() + durationDays * 86400000;
  const daysLeft = Math.ceil((expires - Date.now()) / 86400000);
  return daysLeft > 0 ? `${daysLeft} μέρες ακόμα` : "Έληξε";
}

function DurationPicker({ unit, setUnit, value, setValue }: { unit: DurationUnit; setUnit: (u: DurationUnit) => void; value: number; setValue: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {unit !== "lifetime" && (
        <input
          type="number"
          min={1}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-14 text-xs bg-surface2 border border-border rounded px-2 py-1.5 text-ink"
        />
      )}
      <select
        value={unit}
        onChange={(e) => setUnit(e.target.value as DurationUnit)}
        className="text-xs font-bold bg-lime/15 border-2 border-lime rounded px-2 py-1.5 text-lime focus:outline-none focus:ring-2 focus:ring-lime/50"
      >
        <option value="days">Μέρες</option>
        <option value="months">Μήνες</option>
        <option value="years">Έτη</option>
        <option value="lifetime">Lifetime</option>
      </select>
    </div>
  );
}

export function PromoCodeManager({ initialCodes }: { initialCodes: PromoCode[] }) {
  const [codes, setCodes] = useState(initialCodes);
  const [count, setCount] = useState(10);
  const [unit, setUnit] = useState<DurationUnit>("months");
  const [value, setValue] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editUnit, setEditUnit] = useState<DurationUnit>("months");
  const [editValue, setEditValue] = useState(1);

  function toDurationDays(u: DurationUnit, v: number): number | null {
    return u === "lifetime" ? null : v * UNIT_TO_DAYS[u];
  }

  async function refresh() {
    const res = await fetch("/api/admin/promo-codes");
    const { codes: fresh } = await res.json();
    setCodes(fresh);
  }

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, durationDays: toDurationDays(unit, value) }),
      });
      if (res.ok) await refresh();
    } finally {
      setLoading(false);
    }
  }

  function startEdit(c: PromoCode) {
    if (c.durationDays == null) {
      setEditUnit("lifetime");
      setEditValue(1);
    } else if (c.durationDays % 365 === 0) {
      setEditUnit("years");
      setEditValue(c.durationDays / 365);
    } else if (c.durationDays % 30 === 0) {
      setEditUnit("months");
      setEditValue(c.durationDays / 30);
    } else {
      setEditUnit("days");
      setEditValue(c.durationDays);
    }
    setEditingCode(c.code);
  }

  async function saveEdit(code: string) {
    await fetch("/api/admin/promo-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, durationDays: toDurationDays(editUnit, editValue) }),
    });
    setEditingCode(null);
    await refresh();
  }

  async function remove(code: string) {
    await fetch("/api/admin/promo-codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setCodes((prev) => prev.filter((c) => c.code !== code));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="number"
          min={1}
          max={50}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-16 text-xs bg-surface2 border border-border rounded px-2 py-1.5 text-ink"
        />
        <span className="text-[10px] text-dim">κωδικοί, διάρκεια:</span>
        <DurationPicker unit={unit} setUnit={setUnit} value={value} setValue={setValue} />
        <button onClick={generate} disabled={loading} className="btn-primary !py-1.5 text-xs">
          {loading ? "..." : "Δημιουργία"}
        </button>
      </div>
      {codes.length > 0 && (
        <div className="card overflow-x-auto mb-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[9px] uppercase tracking-wide font-mono text-dim border-b border-border/60">
                <th className="text-left py-2 px-3">Κωδικός</th>
                <th className="text-left py-2 px-3">Διάρκεια</th>
                <th className="text-left py-2 px-3">Κατάσταση</th>
                <th className="text-right py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.code} className="border-b border-border/40 last:border-0">
                  <td className="py-2 px-3 font-mono text-ink">{c.code}</td>
                  <td className="py-2 px-3 text-muted">
                    {editingCode === c.code ? (
                      <div className="flex items-center gap-1.5">
                        <DurationPicker unit={editUnit} setUnit={setEditUnit} value={editValue} setValue={setEditValue} />
                        <button onClick={() => saveEdit(c.code)} className="text-lime font-bold text-[10px]">
                          OK
                        </button>
                      </div>
                    ) : (
                      durationLabel(c.durationDays)
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {c.redeemedBy ? (
                      <span className="text-dim">
                        {c.redeemedBy.email} — {c.redeemedAt && daysRemaining(c.redeemedAt, c.durationDays)}
                      </span>
                    ) : (
                      <span className="text-lime font-bold">Διαθέσιμος</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right whitespace-nowrap">
                    {editingCode !== c.code && (
                      <button onClick={() => startEdit(c)} className="text-dim hover:text-lime mr-2">
                        <Pencil size={12} className="inline" />
                      </button>
                    )}
                    <button onClick={() => remove(c.code)} className="text-dim hover:text-rose">
                      <Trash2 size={12} className="inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

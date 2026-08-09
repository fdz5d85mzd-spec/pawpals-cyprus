"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

export function CommissionRateEditor({ affiliateId, initialPercent }: { affiliateId: string; initialPercent: number }) {
  const [percent, setPercent] = useState(initialPercent);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialPercent);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/set-commission-rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId, commissionPercent: value }),
      });
      if (res.ok) {
        setPercent(value);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1 justify-end">
        <input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-14 text-xs bg-surface2 border border-border rounded px-1.5 py-1 text-ink text-right"
        />
        <button onClick={save} disabled={saving} className="text-[10px] text-lime font-bold">
          {saving ? "..." : "OK"}
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-ink hover:text-lime">
      {percent}% <Pencil size={10} />
    </button>
  );
}

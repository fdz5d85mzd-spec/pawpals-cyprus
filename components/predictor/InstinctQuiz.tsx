"use client";

import { useState } from "react";
import { Brain } from "lucide-react";
import { Eyebrow } from "./ui";

// Lightweight, stateless engagement widget: pick 1/X/2 before seeing the
// model's number, then compare. No backend — just a fun gut-check against
// the math, not a betting slip.
export function InstinctQuiz({
  homeName,
  awayName,
  winHome,
  draw,
  winAway,
}: {
  homeName: string;
  awayName: string;
  winHome: number;
  draw: number;
  winAway: number;
}) {
  const [pick, setPick] = useState<"1" | "X" | "2" | null>(null);

  const modelPick = winHome >= draw && winHome >= winAway ? "1" : winAway >= draw && winAway >= winHome ? "2" : "X";
  const modelPct = modelPick === "1" ? winHome : modelPick === "2" ? winAway : draw;
  const agree = pick === modelPick;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Brain size={13} className="text-dim" />
        <Eyebrow>Δοκίμασε το ένστικτό σου</Eyebrow>
      </div>
      <div className="text-xs text-muted mb-4">
        {homeName} – {awayName}: ποιος κερδίζει, πριν δεις τι λέει το μοντέλο;
      </div>

      {!pick ? (
        <div className="grid grid-cols-3 gap-2">
          {(["1", "X", "2"] as const).map((p) => (
            <button key={p} onClick={() => setPick(p)} className="btn-secondary">
              {p}
            </button>
          ))}
        </div>
      ) : (
        <div className="animate-fade-up">
          <div className="text-xs text-ink mb-2">
            Εσύ: <b>{pick}</b> · Μοντέλο: <b className="text-lime">{modelPick}</b> ({modelPct}%)
          </div>
          <div className={`text-xs font-bold ${agree ? "text-lime" : "text-amber"}`}>
            {agree ? "Ίδια γνώμη με το μοντέλο! 🎯" : "Διαφορετική άποψη — δες γιατί στη σελίδα του αγώνα."}
          </div>
          <button onClick={() => setPick(null)} className="text-[10px] text-dim mt-3 underline">
            Ξαναδοκίμασε
          </button>
        </div>
      )}
    </div>
  );
}

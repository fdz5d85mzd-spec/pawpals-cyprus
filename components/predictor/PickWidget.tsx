"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Target } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Eyebrow } from "./ui";
import type { PickChoice } from "@prisma/client";

export function PickWidget({
  fixtureId,
  homeName,
  awayName,
  isLoggedIn,
  locked,
  initialPick,
  hit,
}: {
  fixtureId: number;
  homeName: string;
  awayName: string;
  isLoggedIn: boolean;
  locked: boolean;
  initialPick: PickChoice | null;
  hit: boolean | null;
}) {
  const t = useTranslations("picks");
  const tHome = useTranslations("home");
  const [pick, setPick] = useState<PickChoice | null>(initialPick);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = (p: PickChoice) => (p === "HOME" ? homeName : p === "AWAY" ? awayName : tHome("draw"));

  async function submit(next: PickChoice) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixtureId, pick: next }),
      });
      if (!res.ok) throw new Error();
      setPick(next);
      setEditing(false);
    } catch {
      setError(t("error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target size={13} className="text-dim" />
        <Eyebrow>{t("title")}</Eyebrow>
      </div>

      {!isLoggedIn ? (
        <Link href="/login" className="text-xs text-lime font-bold">
          {t("loginPrompt")}
        </Link>
      ) : locked ? (
        pick ? (
          <div>
            <div className="text-xs text-ink mb-1.5">{t("yourPick", { pick: label(pick) })}</div>
            {hit === null ? (
              <div className="text-xs text-amber font-bold">{t("pending")}</div>
            ) : (
              <div className={`text-xs font-bold ${hit ? "text-lime" : "text-rose"}`}>{hit ? t("hit") : t("miss")}</div>
            )}
          </div>
        ) : (
          <div className="text-xs text-dim">{t("missedPick")}</div>
        )
      ) : pick && !editing ? (
        <div className="animate-fade-up">
          <div className="text-xs text-ink mb-2">{t("yourPick", { pick: label(pick) })}</div>
          <button onClick={() => setEditing(true)} className="text-[10px] text-dim underline">
            {t("change")}
          </button>
        </div>
      ) : (
        <div>
          <div className="text-xs text-muted mb-3">{t("prompt")}</div>
          <div className="grid grid-cols-3 gap-2">
            {(["HOME", "DRAW", "AWAY"] as const).map((p) => (
              <button key={p} disabled={saving} onClick={() => submit(p)} className="btn-secondary">
                {p === "HOME" ? "1" : p === "DRAW" ? "X" : "2"}
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <div className="mt-2 text-[11px] text-rose">{error}</div>}
    </div>
  );
}

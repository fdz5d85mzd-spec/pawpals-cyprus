"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { LifeBuoy } from "lucide-react";

export default function HelpPage() {
  const { data: session } = useSession();
  const t = useTranslations("help");
  const [name, setName] = useState(session?.user?.name ?? "");
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/helpdesk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, subject, body }),
    });
    setLoading(false);
    if (!res.ok) {
      setError(t("error"));
      return;
    }
    setDone(true);
    setSubject("");
    setBody("");
  }

  return (
    <div className="max-w-2xl mx-auto px-5 pt-8 pb-16">
      <div className="flex items-center gap-2 mb-2 animate-fade-up">
        <LifeBuoy size={16} className="text-lime" />
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-dim">{t("kicker")}</span>
      </div>
      <h1 className="font-display text-4xl mb-3 font-extrabold text-ink tracking-tight animate-fade-up" style={{ animationDelay: "60ms" }}>
        {t("title")}
      </h1>
      <p className="text-sm text-muted mb-8 animate-fade-up" style={{ animationDelay: "120ms" }}>
        {t("subtitle")}
      </p>

      {done ? (
        <div className="card p-6 text-center">
          <div className="text-lime font-bold text-sm mb-1">{t("sent")}</div>
          <div className="text-xs text-dim">{t("sentSub")}</div>
        </div>
      ) : (
        <form onSubmit={submit} className="card p-5 space-y-3">
          <input
            type="text"
            required
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
          <input
            type="email"
            required
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
          <input
            type="text"
            required
            placeholder={t("subjectPlaceholder")}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="input"
          />
          <textarea
            required
            minLength={5}
            placeholder={t("bodyPlaceholder")}
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="input resize-none"
          />
          {error && <div className="text-xs text-rose">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "..." : t("submit")}
          </button>
        </form>
      )}
    </div>
  );
}

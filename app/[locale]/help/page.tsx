"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { LifeBuoy } from "lucide-react";

export default function HelpPage() {
  const { data: session } = useSession();
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
      setError("Κάτι πήγε στραβά, δοκίμασε ξανά.");
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
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-dim">Υποστήριξη</span>
      </div>
      <h1 className="font-display text-4xl mb-3 font-extrabold text-ink tracking-tight animate-fade-up" style={{ animationDelay: "60ms" }}>
        Πώς μπορούμε να βοηθήσουμε;
      </h1>
      <p className="text-sm text-muted mb-8 animate-fade-up" style={{ animationDelay: "120ms" }}>
        Στείλε μας το ερώτημά σου και θα σου απαντήσουμε στο email σου το συντομότερο δυνατό.
      </p>

      {done ? (
        <div className="card p-6 text-center">
          <div className="text-lime font-bold text-sm mb-1">Το μήνυμα στάλθηκε ✓</div>
          <div className="text-xs text-dim">Θα επικοινωνήσουμε μαζί σου σύντομα.</div>
        </div>
      ) : (
        <form onSubmit={submit} className="card p-5 space-y-3">
          <input
            type="text"
            required
            placeholder="Όνομα"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
          <input
            type="text"
            required
            placeholder="Θέμα"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="input"
          />
          <textarea
            required
            minLength={5}
            placeholder="Το μήνυμά σου..."
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="input resize-none"
          />
          {error && <div className="text-xs text-rose">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "..." : "Αποστολή"}
          </button>
        </form>
      )}
    </div>
  );
}

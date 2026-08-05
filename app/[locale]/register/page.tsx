"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [emailUpdatesOptIn, setEmailUpdatesOptIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, email, password, dateOfBirth, acceptTerms, emailUpdatesOptIn }),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(
        data.error?.formErrors?.[0] ??
          data.error?.fieldErrors?.username?.[0] ??
          data.error?.fieldErrors?.acceptTerms?.[0] ??
          data.error ??
          "Κάτι πήγε στραβά."
      );
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-xs mx-auto px-5 py-16">
      <h1 className="font-display text-3xl mb-8 font-extrabold text-ink tracking-tight">Εγγραφή</h1>
      <form onSubmit={onSubmit} className="card p-5 space-y-3">
        <input
          type="text"
          required
          placeholder="Όνομα"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
        />
        <input
          type="text"
          required
          placeholder="Username (θα φαίνεται στα σχόλιά σου)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
          type="password"
          required
          minLength={8}
          placeholder="Κωδικός (τουλάχιστον 8 χαρακτήρες)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
        <div>
          <label className="block text-[10px] uppercase tracking-wide font-mono mb-1.5 text-dim">Ημερομηνία γέννησης</label>
          <input
            type="date"
            required
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="input"
          />
        </div>

        <label className="flex items-start gap-2 text-[11px] text-muted pt-1">
          <input
            type="checkbox"
            required
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Αποδέχομαι τους{" "}
            <Link href="/terms" className="text-lime font-bold">
              Όρους Χρήσης
            </Link>{" "}
            και τους κανονισμούς της σελίδας.
          </span>
        </label>

        <label className="flex items-start gap-2 text-[11px] text-muted">
          <input
            type="checkbox"
            checked={emailUpdatesOptIn}
            onChange={(e) => setEmailUpdatesOptIn(e.target.checked)}
            className="mt-0.5"
          />
          <span>Θέλω να λαμβάνω ενημερώσεις με σημαντικά γεγονότα &amp; προβλέψεις μέσω email.</span>
        </label>

        {error && <div className="text-xs text-rose">{error}</div>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "..." : "Δημιουργία λογαριασμού"}
        </button>
      </form>
      <p className="mt-4 text-xs text-muted">
        Έχεις ήδη λογαριασμό;{" "}
        <Link href="/login" className="text-lime font-bold">
          Σύνδεση
        </Link>
      </p>
    </div>
  );
}

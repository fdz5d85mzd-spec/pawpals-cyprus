"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Λάθος email ή κωδικός.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-xs mx-auto px-5 py-16">
      <h1 className="font-display text-3xl mb-8 font-extrabold text-ink tracking-tight">Σύνδεση</h1>
      <form onSubmit={onSubmit} className="card p-5 space-y-3">
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
          placeholder="Κωδικός"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
        {error && <div className="text-xs text-rose">{error}</div>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "..." : "Σύνδεση"}
        </button>
      </form>
      <p className="mt-4 text-xs text-muted">
        Δεν έχεις λογαριασμό;{" "}
        <Link href="/register" className="text-lime font-bold">
          Εγγραφή
        </Link>
      </p>
    </div>
  );
}

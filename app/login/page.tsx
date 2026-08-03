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
    <div className="max-w-xs mx-auto px-5 py-12">
      <h1 className="font-display text-2xl mb-6 font-bold text-ink">Σύνδεση</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full text-sm px-3 py-2.5 rounded-lg bg-surface border border-border text-ink"
        />
        <input
          type="password"
          required
          placeholder="Κωδικός"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full text-sm px-3 py-2.5 rounded-lg bg-surface border border-border text-ink"
        />
        {error && <div className="text-xs text-[#E0665A]">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full text-xs font-mono font-bold px-4 py-2.5 rounded-full bg-lime text-bg disabled:opacity-60"
        >
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

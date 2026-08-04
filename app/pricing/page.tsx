"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check, Crown } from "lucide-react";

const FREE_FEATURES = ["Αποτέλεσμα 1Χ2 για όλους τους αγώνες σε 24ω", "Ιστορικό & ακρίβεια μοντέλου", "Αξιολογήσεις & εισηγήσεις"];
const PRO_FEATURES = [
  "Όλα του Free, plus:",
  "Διπλή ευκαιρία, Ασιατικό χάντικαπ, ΗΜ/ΤΑ",
  "Over/Under όλες οι γραμμές, BTTS",
  "Ακριβές σκορ top-3, πρόταση σκόρερ",
  "Κόρνερ/Κάρτες, confidence score",
  "Όλα τα πρωταθλήματα",
];

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function upgrade() {
    if (!session) {
      router.push("/login");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (data.url) window.location.href = data.url;
  }

  return (
    <div className="max-w-xl mx-auto px-5 pt-8 pb-16">
      <div className="text-[10px] tracking-[0.2em] uppercase font-mono mb-2 text-dim animate-fade-up">Τιμές</div>
      <h1 className="font-display text-4xl mb-8 font-extrabold text-ink tracking-tight animate-fade-up" style={{ animationDelay: "60ms" }}>
        Επίλεξε το πλάνο σου
      </h1>

      <div className="grid grid-cols-1 gap-4">
        <div className="card p-6 animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="text-[10px] uppercase tracking-wide font-mono mb-3 text-dim">Free</div>
          <div className="font-display text-3xl mb-5 text-ink font-extrabold">0€</div>
          <ul className="text-xs space-y-2.5 text-muted">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check size={14} className="text-dim mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-6 relative overflow-hidden border-lime/50 animate-fade-up" style={{ animationDelay: "180ms" }}>
          <div className="absolute top-0 right-0 bg-lime text-bg text-[9px] font-bold font-mono px-3 py-1 rounded-bl-xl flex items-center gap-1">
            <Crown size={10} /> POPULAR
          </div>
          <div className="text-[10px] uppercase tracking-wide font-mono mb-3 text-lime">Pro</div>
          <div className="font-display text-3xl mb-5 text-ink font-extrabold">
            6,99€<span className="text-sm text-muted font-normal">/μήνα</span>
          </div>
          <ul className="text-xs space-y-2.5 mb-6 text-muted">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check size={14} className="text-lime mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button onClick={upgrade} disabled={loading} className="btn-primary w-full">
            {loading ? "..." : "Αναβάθμιση σε Pro"}
          </button>
        </div>
      </div>

      <p className="mt-8 text-[11px] leading-relaxed text-dim">
        Το Skorama είναι εργαλείο στατιστικής ανάλυσης, όχι υπηρεσία στοιχηματισμού. Δεν παρέχει εγγυημένα
        κέρδη· οι πιθανότητες προκύπτουν από μαθηματικό μοντέλο πάνω σε ιστορικά δεδομένα. Με την εγγραφή
        αποδέχεσαι τους{" "}
        <a href="/terms" className="text-lime font-bold">
          Όρους Χρήσης
        </a>
        .
      </p>
    </div>
  );
}

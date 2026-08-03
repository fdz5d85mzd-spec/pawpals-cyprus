"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const FREE_FEATURES = ["Αποτέλεσμα 1Χ2 για όλους τους αγώνες σε 24ω", "Ιστορικό & ακρίβεια μοντέλου"];
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
    <div className="max-w-xl mx-auto px-5 py-8">
      <h1 className="font-display text-3xl mb-6 font-bold text-ink">Τιμές</h1>
      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-2xl p-5 bg-surface border border-border">
          <div className="text-[10px] uppercase tracking-wide font-mono mb-2 text-dim">Free</div>
          <div className="font-display text-2xl mb-4 text-ink">0€</div>
          <ul className="text-xs space-y-2 text-muted">
            {FREE_FEATURES.map((f) => (
              <li key={f}>· {f}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl p-5 bg-surface border border-lime">
          <div className="text-[10px] uppercase tracking-wide font-mono mb-2 text-lime">Pro</div>
          <div className="font-display text-2xl mb-4 text-ink">
            9,99€<span className="text-xs text-muted">/μήνα</span>
          </div>
          <ul className="text-xs space-y-2 mb-5 text-muted">
            {PRO_FEATURES.map((f) => (
              <li key={f}>· {f}</li>
            ))}
          </ul>
          <button
            onClick={upgrade}
            disabled={loading}
            className="w-full text-xs font-mono font-bold px-4 py-2.5 rounded-full bg-lime text-bg disabled:opacity-60"
          >
            {loading ? "..." : "Αναβάθμιση σε Pro"}
          </button>
        </div>
      </div>
      <p className="mt-6 text-[11px] leading-relaxed text-dim">
        Το Football Predictor είναι εργαλείο στατιστικής ανάλυσης, όχι υπηρεσία στοιχηματισμού. Δεν παρέχει
        εγγυημένα κέρδη· οι πιθανότητες προκύπτουν από μαθηματικό μοντέλο πάνω σε ιστορικά δεδομένα.
      </p>
    </div>
  );
}

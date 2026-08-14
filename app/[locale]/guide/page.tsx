import { BookOpen, CheckCircle2, Database, ShieldAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export const revalidate = 3600;

export const metadata = { title: "Οδηγίες Χρήσης — Skorama" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <h2 className="font-display text-lg font-bold text-ink mb-2">{title}</h2>
      <div className="text-sm text-muted leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export default async function GuidePage() {
  const tm = await getTranslations("methodUpgrade");
  return (
    <div className="max-w-2xl mx-auto px-5 pt-8 pb-16">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={16} className="text-lime" />
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-dim">Οδηγός</span>
      </div>
      <h1 className="font-display text-4xl mb-8 font-extrabold text-ink tracking-tight">Πώς λειτουργεί το Skorama</h1>

      <div className="card p-6">
        <Section title="1. Τι είναι το Skorama">
          <p>
            Το Skorama είναι εργαλείο <b className="text-ink">στατιστικής ανάλυσης</b> ποδοσφαιρικών αγώνων. Κάθε πρόβλεψη
            προκύπτει από μαθηματικό μοντέλο (Poisson με διόρθωση Dixon-Coles) πάνω σε φόρμα ομάδων, γκολ υπέρ/κατά και έδρα
            — όχι από γνώμη, ή διαίσθηση. <b className="text-ink">Δεν είναι υπηρεσία στοιχηματισμού.</b>
          </p>
        </Section>

        <Section title="2. Πώς να διαβάσεις μια πρόβλεψη">
          <p>
            Στην αρχική σελίδα βλέπεις κάθε αγώνα με τα ποσοστά <b className="text-ink">1 / Χ / 2</b> (νίκη γηπεδούχου,
            ισοπαλία, νίκη φιλοξενούμενου), το πιο πιθανό σκορ, Over/Under 2.5 γκολ, Both Teams to Score (GG/NG) και ΗΜ/ΤΑ.
            Οι προβλέψεις &ldquo;παγώνουν&rdquo; 24 ώρες πριν από κάθε αγώνα και δεν αλλάζουν ξανά — έτσι μπορούμε να δείχνουμε ειλικρινά
            πόσο ακριβείς ήμασταν στο{" "}
            <Link href="/history" className="text-lime font-bold">
              Ιστορικό
            </Link>
            .
          </p>
        </Section>

        <Section title={tm("title")}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
              <Database size={15} className="mb-2 text-lime" />
              <b className="text-xs text-ink">{tm("sourceTitle")}</b>
              <p className="mt-1 text-[11px]">{tm("sourceBody")}</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
              <CheckCircle2 size={15} className="mb-2 text-green" />
              <b className="text-xs text-ink">{tm("modelTitle")}</b>
              <p className="mt-1 text-[11px]">{tm("modelBody")}</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
              <ShieldAlert size={15} className="mb-2 text-amber" />
              <b className="text-xs text-ink">{tm("limitationsTitle")}</b>
              <p className="mt-1 text-[11px]">{tm("limitationsBody")}</p>
            </div>
          </div>
          <p>
            {tm("caveat")} <Link href="/history" className="font-bold text-lime">→</Link>
          </p>
        </Section>

        <Section title="3. Free vs Pro">
          <p>
            Με δωρεάν λογαριασμό βλέπεις το βασικό αποτέλεσμα 1Χ2 για όλους τους αγώνες. Με συνδρομή{" "}
            <b className="text-ink">Pro</b> ξεκλειδώνεις όλες τις υπόλοιπες αγορές (Διπλή ευκαιρία, Ασιατικό χάντικαπ,
            Over/Under όλες τις γραμμές, ΗΜ/ΤΑ, ακριβές σκορ, σκόρερ, κόρνερ/κάρτες) και όλα τα πρωταθλήματα. Δες τις{" "}
            <Link href="/pricing" className="text-lime font-bold">
              τιμές εδώ
            </Link>
            .
          </p>
        </Section>

        <Section title="4. Κάνε τη δική σου πρόβλεψη">
          <p>
            Σε κάθε αγώνα μπορείς να διαλέξεις ποιος κατά τη γνώμη σου θα κερδίσει, <b className="text-ink">πριν</b> δεις τι
            λέει το μοντέλο — ένα μικρό τεστ ενστίκτου. Οι επιλογές σου μετράνε: μόλις τελειώσει ο αγώνας μαθαίνεις αν
            πέτυχες, και η προσωπική σου ακρίβεια εμφανίζεται στη σελίδα{" "}
            <Link href="/account" className="text-lime font-bold">
              Ο λογαριασμός μου
            </Link>{" "}
            και στην{" "}
            <Link href="/leaderboard" className="text-lime font-bold">
              Κατάταξη
            </Link>{" "}
            χρηστών.
          </p>
        </Section>

        <Section title="5. Ειδοποιήσεις & εγκατάσταση σαν εφαρμογή">
          <p>
            Ενεργοποίησε τις push notifications από τον λογαριασμό σου για να μαθαίνεις το πικ της ημέρας χωρίς να ανοίγεις
            το site. Το Skorama εγκαθίσταται και σαν εφαρμογή στο κινητό σου: στο iPhone πάτα Share → &ldquo;Προσθήκη στην Αρχική
            Οθόνη&rdquo;, στο Android το browser σου θα σου προτείνει μόνος του &ldquo;Εγκατάσταση εφαρμογής&rdquo;.
          </p>
        </Section>

        <Section title="6. Γίνε συνεργάτης">
          <p>
            Αν θες να προτείνεις το Skorama σε άλλους και να κερδίζεις πραγματικά χρήματα (όχι μόνο έκπτωση) από κάθε
            πληρωμή τους, δες το{" "}
            <Link href="/affiliate" className="text-lime font-bold">
              πρόγραμμα συνεργατών
            </Link>
            .
          </p>
        </Section>

        <Section title="7. Διαφάνεια">
          <p>
            Δεν κρύβουμε τίποτα: κάθε πρόβλεψη που κάναμε ποτέ, σωστή ή λάθος, φαίνεται στο{" "}
            <Link href="/history" className="text-lime font-bold">
              Ιστορικό & Ακρίβεια
            </Link>
            . Αν κάτι δεν σου αρέσει ή θες κάτι καινούριο, πες το στις{" "}
            <Link href="/suggestions" className="text-lime font-bold">
              Εισηγήσεις
            </Link>{" "}
            ή γράψε μας στην{" "}
            <Link href="/help" className="text-lime font-bold">
              Υποστήριξη
            </Link>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}

import { ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";

export const metadata = { title: "Πολιτική Απορρήτου — Skorama" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-lg font-bold text-ink mb-2">{title}</h2>
      <div className="text-xs text-muted leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-16">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck size={16} className="text-lime" />
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-dim">Νομικά</span>
      </div>
      <h1 className="font-display text-4xl mb-8 font-extrabold text-ink tracking-tight">Πολιτική Απορρήτου</h1>

      <div className="card p-6">
        <Section title="Ποια δεδομένα συλλέγουμε">
          <p>
            Όταν κάνεις εγγραφή: όνομα, username, email, ημερομηνία γέννησης. Όταν κάνεις αναβάθμιση σε Pro: η
            πληρωμή γίνεται εξ ολοκλήρου μέσω <b className="text-ink">Stripe</b> — δεν αποθηκεύουμε ποτέ αριθμούς
            κάρτας στους δικούς μας servers. Επίσης κρατάμε τις προγνώσεις που επιλέγεις, τα σχόλια/αξιολογήσεις που
            γράφεις, και (αν το επιτρέψεις) ένα push subscription για ειδοποιήσεις.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            Χρησιμοποιούμε ένα cookie σύνδεσης (session) για να σε κρατάμε συνδεδεμένο, και ένα cookie συνεργάτη
            (affiliate) όταν έρχεσαι από link συνεργάτη, ώστε να καταγράφεται σωστά ποιος σε παρέπεμψε. Κανένα από
            αυτά δεν χρησιμοποιείται για διαφημιστική παρακολούθηση τρίτων.
          </p>
        </Section>

        <Section title="Με ποιους μοιραζόμαστε δεδομένα">
          <p>
            Με τρίτους που μας βοηθούν να λειτουργήσουμε το Skorama: <b className="text-ink">Stripe</b> (πληρωμές),{" "}
            <b className="text-ink">Resend</b> (email ειδοποιήσεις), <b className="text-ink">Vercel/Supabase</b>{" "}
            (φιλοξενία & βάση δεδομένων), <b className="text-ink">API-Football</b> (δεδομένα αγώνων — δεν λαμβάνει
            ποτέ δικά σου προσωπικά στοιχεία). Δεν πουλάμε ποτέ δεδομένα χρηστών σε τρίτους.
          </p>
        </Section>

        <Section title="Τα δικαιώματά σου">
          <p>
            Μπορείς ανά πάσα στιγμή να ζητήσεις να δεις, να διορθώσεις ή να διαγράψεις τα δεδομένα σου, επικοινωνώντας
            μαζί μας από τη σελίδα{" "}
            <Link href="/help" className="text-lime font-bold">
              Υποστήριξη
            </Link>
            .
          </p>
        </Section>

        <Section title="Επικοινωνία">
          <p>
            Για οτιδήποτε σχετικό με τα προσωπικά σου δεδομένα, χρησιμοποίησε τη σελίδα{" "}
            <Link href="/help" className="text-lime font-bold">
              Υποστήριξη
            </Link>
            . Δες επίσης τους{" "}
            <Link href="/terms" className="text-lime font-bold">
              Όρους Χρήσης
            </Link>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}

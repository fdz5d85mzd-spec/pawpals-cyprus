import { FileText } from "lucide-react";
import { Link } from "@/i18n/navigation";

export const metadata = { title: "Όροι Χρήσης — Skorama" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-lg font-bold text-ink mb-2">{title}</h2>
      <div className="text-xs text-muted leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-16">
      <div className="flex items-center gap-2 mb-2">
        <FileText size={16} className="text-lime" />
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-dim">Νομικά</span>
      </div>
      <h1 className="font-display text-4xl mb-8 font-extrabold text-ink tracking-tight">Όροι Χρήσης</h1>

      <div className="card p-6">
        <Section title="1. Τι είναι το Skorama">
          <p>
            Το Skorama είναι εργαλείο <b className="text-ink">στατιστικής ανάλυσης</b> ποδοσφαιρικών αγώνων,
            βασισμένο σε μαθηματικό μοντέλο (Poisson με διόρθωση Dixon-Coles). <b className="text-ink">Δεν είναι
            υπηρεσία στοιχηματισμού</b> και δεν παρέχει &ldquo;σίγουρες&rdquo; προβλέψεις ή εγγυημένα κέρδη. Οι πιθανότητες
            που εμφανίζονται είναι αποτέλεσμα στατιστικού υπολογισμού πάνω σε ιστορικά δεδομένα και ενδέχεται
            να μην επαληθευτούν.
          </p>
        </Section>

        <Section title="2. Λογαριασμός & Συνδρομές">
          <p>
            Προσφέρουμε πλάνο <b className="text-ink">Free</b> (περιορισμένη πρόσβαση) και πλάνο{" "}
            <b className="text-ink">Pro</b> (πλήρης πρόσβαση, επί πληρωμή, μέσω Stripe). Η συνδρομή Pro
            ανανεώνεται αυτόματα σε μηνιαία βάση εκτός αν ακυρωθεί. Μπορείς να ακυρώσεις οποιαδήποτε στιγμή από
            τη σελίδα λογαριασμού σου — η πρόσβαση Pro παραμένει ενεργή μέχρι το τέλος της τρέχουσας
            χρεωμένης περιόδου, χωρίς μερική επιστροφή χρημάτων για τον υπόλοιπο χρόνο.
          </p>
        </Section>

        <Section title="3. Περιεχόμενο χρηστών">
          <p>
            Σχόλια σε αγώνες, αξιολογήσεις και εισηγήσεις που δημοσιεύεις είναι δική σου ευθύνη. Διατηρούμε το
            δικαίωμα να αφαιρέσουμε περιεχόμενο που είναι προσβλητικό, παράνομο ή άσχετο με το θέμα.
          </p>
        </Section>

        <Section title="4. Περιορισμός ευθύνης">
          <p>
            Το Skorama παρέχεται &ldquo;ως έχει&rdquo;. Δεν φέρουμε ευθύνη για αποφάσεις (οικονομικές ή άλλες) που
            λαμβάνεις βασιζόμενος στις προβλέψεις του μοντέλου. Αν χρησιμοποιείς τις πληροφορίες σε
            συνδυασμό με στοιχηματισμό, αυτό γίνεται αποκλειστικά με δική σου ευθύνη και σύμφωνα με την
            ισχύουσα νομοθεσία της χώρας σου.
          </p>
        </Section>

        <Section title="5. Εφαρμοστέο δίκαιο">
          <p>Οι παρόντες όροι διέπονται από το Ελληνικό δίκαιο. Αρμόδια δικαστήρια ορίζονται τα δικαστήρια Αθηνών.</p>
        </Section>

        <Section title="6. Επικοινωνία">
          <p>
            Για οποιαδήποτε ερώτηση σχετικά με τους όρους χρήσης, επικοινώνησε μαζί μας μέσω της σελίδας{" "}
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

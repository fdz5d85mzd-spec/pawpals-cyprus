// "On this day" football history — deliberately small and only includes
// dates confirmed against well-established, widely-documented sources.
// Getting a date wrong on a public page is worse than having no entry for
// a given day, so this grows slowly rather than guessing to fill gaps.
export interface HistoryFact {
  month: number; // 1-12
  day: number;
  year: number;
  text: string;
}

export const FOOTBALL_HISTORY: HistoryFact[] = [
  { month: 2, day: 6, year: 1958, text: "Η αεροπορική τραγωδία του Μονάχου: το αεροπλάνο της Manchester United συνετρίβη, με 23 νεκρούς ανάμεσά τους μέλη των θρυλικών \"Busby Babes\"." },
  { month: 4, day: 15, year: 1989, text: "Η τραγωδία του Hillsborough στον ημιτελικό Κυπέλλου Αγγλίας Liverpool - Nottingham Forest, με 97 νεκρούς φιλάθλους." },
  { month: 5, day: 25, year: 2005, text: "\"Το θαύμα του Κωνσταντινούπολη\": η Liverpool ισοφάρισε 3-3 από 0-3 με την Milan στον τελικό του Champions League και κατέκτησε τον τίτλο στα πέναλτι." },
  { month: 5, day: 26, year: 1999, text: "Η Manchester United σκόραρε δύο φορές στις καθυστερήσεις (Sheringham, Solskjær) και κέρδισε 2-1 τη Bayern Μονάχου στον τελικό του Champions League στο Camp Nou, ολοκληρώνοντας το θρυλικό treble." },
  { month: 5, day: 29, year: 1985, text: "Η τραγωδία του Heysel πριν τον τελικό του Κυπέλλου Πρωταθλητριών Liverpool - Juventus στις Βρυξέλλες, με 39 νεκρούς." },
  { month: 6, day: 22, year: 1986, text: "Ο Ντιέγκο Μαραντόνα σκόραρε το \"Χέρι του Θεού\" και το \"Γκολ του Αιώνα\" στο ίδιο ματς, στον προημιτελικό Αργεντινή - Αγγλία του Παγκοσμίου Κυπέλλου στο Μεξικό." },
  { month: 7, day: 9, year: 2006, text: "Ο Ζινεντίν Ζιντάν αποβλήθηκε για κεφαλιά στον Ματεράτσι στον τελικό του Παγκοσμίου Κυπέλλου· η Ιταλία κέρδισε τη Γαλλία στα πέναλτι στο Βερολίνο." },
  { month: 7, day: 11, year: 2021, text: "Η Ιταλία κατέκτησε το Euro 2020 (που παίχτηκε το 2021) κερδίζοντας την Αγγλία στα πέναλτι στο Wembley." },
  { month: 7, day: 13, year: 2014, text: "Η Γερμανία κέρδισε 1-0 την Αργεντινή στον τελικό του Παγκοσμίου Κυπέλλου στο Ρίο ντε Τζανέιρο, με γκολ του Mario Götze στην παράταση." },
  { month: 7, day: 15, year: 2018, text: "Η Γαλλία κατέκτησε το Παγκόσμιο Κύπελλο νικώντας την Κροατία 4-2 στον τελικό στη Μόσχα." },
  { month: 7, day: 16, year: 1950, text: "\"Maracanazo\": η Ουρουγουάη κέρδισε 2-1 τη Βραζιλία στο γεμάτο Μαρακανά, στο αποφασιστικό ματς που έκρινε το Παγκόσμιο Κύπελλο του 1950." },
  { month: 7, day: 30, year: 1966, text: "Η Αγγλία κατέκτησε το πρώτο (και μοναδικό) της Παγκόσμιο Κύπελλο, κερδίζοντας 4-2 τη Δυτική Γερμανία στο Wembley με χατ-τρικ του Geoff Hurst." },
  { month: 12, day: 18, year: 2022, text: "Η Αργεντινή του Λιονέλ Μέσι κατέκτησε το Παγκόσμιο Κύπελλο στο Κατάρ, κερδίζοντας τη Γαλλία στα πέναλτι σε έναν από τους πιο θρυλικούς τελικούς όλων των εποχών." },
];

export function getTodaysFootballHistory(date: Date = new Date()): HistoryFact | undefined {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return FOOTBALL_HISTORY.find((f) => f.month === month && f.day === day);
}

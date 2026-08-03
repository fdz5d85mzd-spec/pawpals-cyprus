# Skorama

Στατιστικό μοντέλο πρόβλεψης ποδοσφαιρικών αγώνων (Poisson + διόρθωση
Dixon-Coles) πάνω σε πραγματικά δεδομένα, με λογαριασμούς χρηστών και
συνδρομή Free/Pro. Next.js (App Router) + TypeScript + Tailwind,
deploy-ready για Vercel. Domain: [skorama.xyz](https://skorama.xyz).

Το μαθηματικό μοντέλο (`lib/model.ts`) είναι πιστό port του αρχικού
`football-predictor.jsx` prototype — `computeModel`/`buildMatrix`/`tauDC`
δεν άλλαξαν, μόνο τα δεδομένα εισόδου: αντί για hardcoded `TEAMS`/`MATCHES`,
τώρα τροφοδοτείται από πραγματικά δεδομένα μέσω API-Football + Postgres.

## Αρχιτεκτονική

- **`lib/model.ts`** — ο κινητήρας πρόβλεψης (Poisson matrix + Dixon-Coles).
  Παράγει 1Χ2, Διπλή Ευκαιρία, Ασιατικό Χάντικαπ, ΗΜ/ΤΑ, Over/Under, BTTS,
  Ακριβές Σκορ, Σκόρερ — όλα από τον ίδιο πίνακα πιθανοτήτων.
- **`lib/api-football.ts`** — client για το [API-Football](https://www.api-football.com/),
  και mapping των responses στη δομή `TeamStats` που περιμένει το μοντέλο.
- **`prisma/schema.prisma`** — Postgres schema (Supabase/Neon): `League`,
  `Team`, `Player`, `Fixture`, `PredictionSnapshot` (παγωμένη, immutable
  πρόβλεψη), `PredictionResult` (hit/miss ανά αγορά), `User`/`Subscription`.
- **`app/api/cron/*`** — τρία Vercel Cron endpoints:
  - `sync-fixtures` — φέρνει αγώνες σε 48ω παράθυρο, ενημερώνει το cache.
  - `freeze-predictions` — για αγώνες σε 24ω, τρέχει το μοντέλο και
    αποθηκεύει `PredictionSnapshot` (μία φορά ανά αγώνα, immutable).
  - `settle-results` — για τελειωμένους αγώνες, φέρνει το πραγματικό σκορ
    και συγκρίνει με την παγωμένη πρόβλεψη ανά αγορά.
- **`lib/auth.ts`** — NextAuth (Credentials provider + Prisma adapter, JWT
  sessions) — `/login`, `/register`, `/account`.
- **`lib/stripe.ts`** + **`app/api/stripe/*`** — Stripe Checkout (Pro
  μηνιαία συνδρομή) + webhook που ενεργοποιεί/απενεργοποιεί το πλάνο.
- **`components/predictor/`** — UI: heatmap πιθανοτήτων σκορ, bars, stats,
  `ProGate` (θολώνει τις Pro αγορές για Free χρήστες).

## Setup

```bash
npm install
cp .env.example .env   # συμπλήρωσε τα κλειδιά
npm run db:push        # δημιουργεί τα tables στο Postgres σου
npm run dev
```

Χρειάζεσαι:
- Postgres connection string (π.χ. δωρεάν [Supabase](https://supabase.com)
  ή [Neon](https://neon.tech)) → `DATABASE_URL`/`DIRECT_URL`
- [API-Football](https://www.api-football.com/) key → `API_FOOTBALL_KEY`
- Stripe account (test mode αρκεί για ανάπτυξη) → `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY`
- `NEXTAUTH_SECRET` → `openssl rand -base64 32`
- `CRON_SECRET` → ένα τυχαίο μεγάλο string, προστατεύει τα cron endpoints

## Deploy στο Vercel

1. Push σε GitHub repo, μετά "Add New Project" στο Vercel και επίλεξέ το.
2. Πρόσθεσε όλα τα env vars από το `.env.example` στο Vercel dashboard.
3. Deploy. Το `vercel.json` ήδη ορίζει τα 3 cron jobs (καθημερινά).
4. Stripe dashboard → Webhooks → πρόσθεσε endpoint
   `https://<domain>/api/stripe/webhook`, events:
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Πάρε το signing secret →
   `STRIPE_WEBHOOK_SECRET`.

**Σημείωση για το Vercel Hobby πλάνο:** τα cron jobs στο δωρεάν πλάνο
τρέχουν το πολύ 1 φορά/ημέρα ανά job — γι' αυτό τα τρία jobs τρέχουν σε
διαφορετικές ώρες (06:00/07:00/08:00 UTC) παρά ταυτόχρονα. Σε Pro πλάνο
μπορείς να ανεβάσεις τη συχνότητα του `freeze-predictions` (π.χ. ωριαία)
για ακριβέστερο "24ω πριν" κλείδωμα.

## Γνωστό εύρημα `npm audit`

`next-auth@4` (v4, όχι το v5/Auth.js beta) κουβαλάει εσωτερικά ένα παλιότερο
`@auth/core` με μερικά διορθωμένα advisories (OAuth state/PKCE cookie
binding, email-normalizer homoglyph bypass, uncaught exception σε malformed
Bearer header). Δοκιμάστηκε override σε νεότερο `@auth/core`, αλλά
συγκρούεται με το peer dependency του `nodemailer` (legacy peer range) και
σπάει το `npm install`. Μιας και το app χρησιμοποιεί μόνο
`CredentialsProvider` + JWT sessions (όχι OAuth, όχι Email/magic-link
provider), η πραγματική επιφάνεια έκθεσης περιορίζεται ουσιαστικά στο
malformed-header exception. Επόμενο βήμα όποτε σταθεροποιηθεί το
next-auth v5 (Auth.js): migration σε αυτό, που δεν έχει αυτόν τον
περιορισμό.

## Επόμενα βήματα (δεν είναι μέσα σε αυτή την έκδοση)

- Πολλαπλά πρωταθλήματα ταυτόχρονα στο UI (φίλτρα ανά χώρα/λίγκα)
- Push notifications 24ω πριν κάθε αγώνα
- OAuth providers (Google κ.λπ.) πέρα από email/password
- Παρακολούθηση rate limits του API-Football (free tier: 100 req/day)

## ⚠️ Νομικό/κανονιστικό πλαίσιο

Αν το προϊόν παρουσιάζεται ως εργαλείο για στοιχηματισμό (όχι απλά
στατιστική ανάλυση), πιθανόν να εμπίπτει σε κανονισμούς της **ΕΕΕΠ**
στην Ελλάδα (Επιτροπή Εποπτείας και Ελέγχου Παιγνίων). Το copy σε αυτή
την έκδοση (π.χ. στη σελίδα `/pricing`) πλασάρει το προϊόν ρητά ως
εργαλείο στατιστικής ανάλυσης, όχι betting tips service — αλλά αυτό δεν
υποκαθιστά νομική γνωμοδότηση. Κάνε νομικό έλεγχο πριν ενεργοποιήσεις
πραγματικές πληρωμές, ανάλογα με το πώς τελικά θα πλασαριστεί το προϊόν.

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

const HASHTAGS_CORE = ["#Skorama", "#Ποδόσφαιρο", "#ΣτατιστικέςΠροβλέψεις"];

function outcomeLabel(code: string, homeName: string, awayName: string): string {
  return code === "1" ? homeName : code === "2" ? awayName : "Ισοπαλία";
}

export function buildCorrectPredictionPost(input: {
  homeName: string;
  awayName: string;
  homeGoals: number;
  awayGoals: number;
  predicted: string;
  predictedPct: number;
  leagueName: string;
}): string {
  const pickLabel = outcomeLabel(input.predicted, input.homeName, input.awayName);
  const score = `${input.homeGoals}-${input.awayGoals}`;
  const matchup = `${input.homeName} ${score} ${input.awayName}`;

  const templates = [
    `✅ Στόχος πετύχε! Το μοντέλο μας έδινε ${input.predictedPct}% στο «${pickLabel}» για το ${matchup} — και βγήκε ακριβώς έτσι.\n\n${input.leagueName} · Δες την ανάλυση στο skorama.xyz`,
    `🎯 Ξανά σωστά! ${matchup} — είχαμε προβλέψει «${pickLabel}» με ${input.predictedPct}% πιθανότητα, πριν καν φανεί.\n\nΟι αριθμοί δεν λένε ψέματα.`,
    `📊 Το μαθηματικό μοντέλο του Skorama τα βρήκε ξανά: ${matchup}, πρόβλεψη «${pickLabel}» στο ${input.predictedPct}% — confirmed.\n\n${input.leagueName}`,
    `🔥 ${matchup}\nΕίχαμε πει «${pickLabel}» (${input.predictedPct}%) πριν τον αγώνα. Σωστό!\n\nΔες όλες τις προβλέψεις στο skorama.xyz`,
  ];

  return `${pickRandom(templates)}\n\n${HASHTAGS_CORE.join(" ")} #${input.leagueName.replace(/\s+/g, "")}`;
}

export function buildPickOfDayPost(input: {
  homeName: string;
  awayName: string;
  predicted: string;
  predictedPct: number;
  leagueName: string;
}): string {
  const pickLabel = outcomeLabel(input.predicted, input.homeName, input.awayName);
  const matchup = `${input.homeName} – ${input.awayName}`;

  const templates = [
    `🔥 Η πρόταση της ημέρας: ${matchup}\nΤο μοντέλο μας δίνει ${input.predictedPct}% στο «${pickLabel}».\n\n${input.leagueName} · Δες όλη την ανάλυση (1Χ2, σκορ, over/under) στο skorama.xyz`,
    `📈 Σήμερα ξεχωρίζει το ${matchup} — προβάδισμα ${input.predictedPct}% για «${pickLabel}» σύμφωνα με το στατιστικό μας μοντέλο.\n\nskorama.xyz`,
    `⚽ ${matchup}\nΣτατιστικό προβάδισμα ${input.predictedPct}% για «${pickLabel}». Καθαρά μαθηματικά, καμία γνώμη.\n\n${input.leagueName}`,
  ];

  return `${pickRandom(templates)}\n\n${HASHTAGS_CORE.join(" ")} #ΠρότασηΤηςΗμέρας`;
}

export function buildWeeklyAccuracyPost(input: { correct: number; total: number; accuracy: number }): string {
  const templates = [
    `📊 Απολογισμός εβδομάδας: ${input.correct}/${input.total} σωστές προβλέψεις (${input.accuracy}%).\n\nΌλο το ιστορικό, δημόσιο και ελέγξιμο, στο skorama.xyz/history`,
    `🧮 Αυτή την εβδομάδα το μοντέλο του Skorama πέτυχε ${input.accuracy}% (${input.correct} από ${input.total} αγώνες).\n\nΔιαφάνεια πάνω απ' όλα — δες όλο το ιστορικό στη σελίδα μας.`,
    `✅ ${input.accuracy}% ακρίβεια αυτή την εβδομάδα (${input.correct}/${input.total}). Καμία υπόσχεση για εγγυημένα κέρδη — μόνο αριθμοί, ανοιχτοί σε όλους.`,
  ];

  return `${pickRandom(templates)}\n\n${HASHTAGS_CORE.join(" ")} #ΑπολογισμόςΕβδομάδας`;
}

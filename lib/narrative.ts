import type { FormResult } from "./model";
import type { PresentedPrediction } from "./present";

function formWord(form: FormResult[]): string {
  if (form.length === 0) return "χωρίς πρόσφατα δεδομένα φόρμας";
  const wins = form.filter((r) => r === "W").length;
  const losses = form.filter((r) => r === "L").length;
  if (wins >= 4) return "σε εξαιρετική φόρμα";
  if (wins >= 3) return "σε καλή φόρμα";
  if (losses >= 3) return "σε φτωχή φόρμα";
  return "σε μέτρια φόρμα";
}

// One free-to-read teaser sentence, plus a longer Pro-only breakdown built
// entirely from numbers the model already produced — no extra API calls.
export function buildMatchNarrative(params: {
  homeName: string;
  awayName: string;
  homeForm: FormResult[];
  awayForm: FormResult[];
  homePos: number | null;
  awayPos: number | null;
  model: PresentedPrediction;
}): { teaser: string; details: string[] } {
  const { homeName, awayName, homeForm, awayForm, homePos, awayPos, model } = params;

  const favored =
    model.winHome >= model.draw && model.winHome >= model.winAway
      ? { name: homeName, pct: model.winHome }
      : model.winAway >= model.draw && model.winAway >= model.winHome
      ? { name: awayName, pct: model.winAway }
      : null;

  const teaser = favored
    ? `Το μοντέλο βλέπει την ${favored.name} φαβορί με ${favored.pct}% πιθανότητα νίκης.`
    : `Πολύ ισορροπημένο ματς σύμφωνα με το μοντέλο — καμία ομάδα δεν ξεπερνά το 40%.`;

  const details: string[] = [
    `${homeName} (${formWord(homeForm)}${homePos ? `, #${homePos} στη βαθμολογία` : ""}) υποδέχεται την ${awayName} (${formWord(
      awayForm
    )}${awayPos ? `, #${awayPos} στη βαθμολογία` : ""}).`,
    `Αναμενόμενα γκολ (λ): ${model.lambdaHome.toFixed(2)} – ${model.lambdaAway.toFixed(2)}. Πιο πιθανό σκορ: ${
      model.scores[0].h
    }-${model.scores[0].a} (${model.scores[0].pct}%).`,
  ];

  if (model.bttsYes >= 55) {
    details.push(`Και οι δύο ομάδες έχουν αυξημένη πιθανότητα να σκοράρουν (BTTS ${model.bttsYes}%).`);
  } else if (model.ouLines[1].under >= 55) {
    details.push(`Οι αριθμοί δείχνουν ματς με λίγα γκολ (Under 2.5 στο ${model.ouLines[1].under}%).`);
  } else {
    details.push(`Η γραμμή 2.5 γκολ είναι σχεδόν ισορροπημένη (Over ${model.ouLines[1].over}% / Under ${model.ouLines[1].under}%).`);
  }

  if (model.scorer) {
    details.push(
      `${model.scorer.name} ξεχωρίζει ως πιθανός σκόρερ με ${model.scorer.prob}% πιθανότητα να σκοράρει ανά πάσα στιγμή.`
    );
  }

  details.push(`Confidence score του μοντέλου για αυτό το ματς: ${model.confidence}%.`);

  return { teaser, details };
}

export function buildWeeklyRecapEmail(params: { total: number; correct: number; accuracy: number }): {
  subject: string;
  html: string;
} {
  const { total, correct, accuracy } = params;
  const subject = `Skorama: η εβδομάδα σε νούμερα — ${accuracy}% ακρίβεια`;
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; background: #0B0B0D; color: #FAFAFA; padding: 32px 24px;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:24px;">
        <span style="width:28px; height:28px; background:#FFC800; color:#0B0B0D; font-weight:800; font-size:14px; display:inline-flex; align-items:center; justify-content:center;">S</span>
        <span style="font-weight:800; font-size:14px; letter-spacing:0.5px; text-transform:uppercase;">Skorama</span>
      </div>
      <h1 style="font-size:22px; margin:0 0 4px;">Η εβδομάδα σε νούμερα</h1>
      <p style="font-size:13px; color:#6B6B70; margin:0 0 24px;">Τελευταίες 7 μέρες</p>
      <div style="background:#161618; border:1px solid #2E2E33; padding:24px; margin-bottom:20px;">
        <div style="font-size:44px; font-weight:800; color:#FFC800; font-family: monospace;">${accuracy}%</div>
        <div style="font-size:13px; color:#A8A8AC; margin-top:6px;">
          ${correct} σωστές προγνώσεις σε ${total} αγορές που κρίθηκαν
        </div>
      </div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://skorama.xyz"}/history"
         style="display:inline-block; background:#FFC800; color:#0B0B0D; font-weight:800; font-size:14px; text-decoration:none; padding:12px 24px;">
        Δες όλο το ιστορικό
      </a>
      <p style="font-size:11px; color:#6B6B70; margin-top:32px; line-height:1.5;">
        Skorama — εργαλείο στατιστικής ανάλυσης, όχι υπηρεσία στοιχηματισμού.
      </p>
    </div>
  `;
  return { subject, html };
}

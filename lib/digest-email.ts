export interface DigestPick {
  fixtureId: number;
  homeName: string;
  awayName: string;
  pickLabel: string;
  pct: number;
}

// Plain inline-styled HTML — email clients strip <style> blocks and modern
// CSS unpredictably, so every rule that matters is inlined here.
export function buildDigestEmail(picks: DigestPick[]): { subject: string; html: string } {
  const top = picks[0];
  const subject = top
    ? `Skorama: ${top.homeName} – ${top.awayName} (${top.pickLabel} ${top.pct}%) και ${picks.length - 1} ακόμα προβλέψεις`
    : "Skorama: οι σημερινές προβλέψεις";

  const rows = picks
    .map(
      (p) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #26262b;">
          <div style="font-size:12px;color:#8a8a90;margin-bottom:4px;">${p.homeName} – ${p.awayName}</div>
          <div style="font-size:14px;font-weight:700;color:#111114;">${p.pickLabel}</div>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #26262b;text-align:right;font-size:18px;font-weight:800;color:#b8860b;">
          ${p.pct}%
        </td>
      </tr>`
    )
    .join("");

  const html = `
  <div style="background:#0b0b0d;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#111114;border:2px solid #ffc800;">
      <tr>
        <td style="padding:20px 16px;">
          <div style="display:inline-block;background:#ffc800;color:#0b0b0d;font-weight:800;font-size:14px;padding:6px 10px;margin-bottom:16px;">SKORAMA</div>
          <h1 style="font-size:20px;color:#ffffff;margin:0 0 8px;">Οι σημερινές προβλέψεις</h1>
          <p style="font-size:12px;color:#8a8a90;margin:0 0 16px;">Στατιστικό μοντέλο Poisson — δεν εγγυάται κέρδη, μόνο αριθμούς.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 16px 16px;">
          <table role="presentation" width="100%" style="background:#0b0b0d;">
            ${rows}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 16px 24px;">
          <a href="https://skorama.xyz" style="display:inline-block;background:#ffc800;color:#0b0b0d;font-weight:800;font-size:13px;text-decoration:none;padding:12px 20px;">
            Δες όλη την ανάλυση →
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:0 16px 20px;border-top:1px solid #26262b;">
          <p style="font-size:10px;color:#57575c;margin:16px 0 0;">
            Λαμβάνεις αυτό το email γιατί επέλεξες ενημερώσεις κατά την εγγραφή σου στο skorama.xyz.
            Μπορείς να το απενεργοποιήσεις από τον λογαριασμό σου.
          </p>
        </td>
      </tr>
    </table>
  </div>`;

  return { subject, html };
}

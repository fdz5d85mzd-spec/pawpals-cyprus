// Same inline-styled-HTML approach as digest-email.ts — email clients strip
// <style> blocks and unpredictable CSS, so every rule that matters is inline.
export function buildAbandonmentEmail(): { subject: string; html: string } {
  const subject = "Έμεινε κάτι στη μέση — η αναβάθμισή σου στο Skorama";
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; background: #0B0B0D; color: #FAFAFA; padding: 32px 24px;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:24px;">
        <span style="width:28px; height:28px; background:#FFC800; color:#0B0B0D; font-weight:800; font-size:14px; display:inline-flex; align-items:center; justify-content:center;">S</span>
        <span style="font-weight:800; font-size:14px; letter-spacing:0.5px; text-transform:uppercase;">Skorama</span>
      </div>
      <h1 style="font-size:22px; margin:0 0 12px;">Ξέχασες κάτι; 👀</h1>
      <p style="font-size:14px; line-height:1.6; color:#A8A8AC; margin:0 0 20px;">
        Ξεκίνησες να αναβαθμίζεις σε Pro αλλά δεν πρόλαβες να ολοκληρώσεις την πληρωμή. Το link έληξε, αλλά
        μπορείς να ξαναδοκιμάσεις οποιαδήποτε στιγμή — τίποτα δεν χρεώθηκε.
      </p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://skorama.xyz"}/pricing"
         style="display:inline-block; background:#FFC800; color:#0B0B0D; font-weight:800; font-size:14px; text-decoration:none; padding:12px 24px;">
        Δες τα πλάνα ξανά
      </a>
      <p style="font-size:11px; color:#6B6B70; margin-top:32px; line-height:1.5;">
        Skorama — εργαλείο στατιστικής ανάλυσης, όχι υπηρεσία στοιχηματισμού.
      </p>
    </div>
  `;
  return { subject, html };
}

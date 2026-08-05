import { FileText } from "lucide-react";
import { getTranslations } from "next-intl/server";
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

export default async function TermsPage() {
  const t = await getTranslations("terms");
  const b = (chunks: React.ReactNode) => <b className="text-ink">{chunks}</b>;

  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-16">
      <div className="flex items-center gap-2 mb-2">
        <FileText size={16} className="text-lime" />
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-dim">{t("kicker")}</span>
      </div>
      <h1 className="font-display text-4xl mb-8 font-extrabold text-ink tracking-tight">{t("title")}</h1>

      <div className="card p-6">
        <Section title={t("section1Title")}>
          <p>{t.rich("section1Body", { b })}</p>
        </Section>

        <Section title={t("section2Title")}>
          <p>{t.rich("section2Body", { b })}</p>
        </Section>

        <Section title={t("section3Title")}>
          <p>{t("section3Body")}</p>
        </Section>

        <Section title={t("section4Title")}>
          <p>{t.rich("section4Body", { b })}</p>
        </Section>

        <Section title={t("section5Title")}>
          <p>{t("section5Body")}</p>
        </Section>

        <Section title={t("section6Title")}>
          <p>
            {t("section6Body")}{" "}
            <Link href="/help" className="text-lime font-bold">
              {t("supportLink")}
            </Link>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}

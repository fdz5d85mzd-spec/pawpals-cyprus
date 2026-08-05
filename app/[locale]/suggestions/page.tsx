import { Lightbulb } from "lucide-react";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Eyebrow } from "@/components/predictor/ui";
import { SuggestionForm } from "@/components/SuggestionForm";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default async function SuggestionsPage() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations("suggestions");
  const STATUS_LABEL: Record<string, string> = {
    OPEN: t("statusOpen"),
    PLANNED: t("statusPlanned"),
    DONE: t("statusDone"),
    DECLINED: t("statusDeclined"),
  };
  const STATUS_CLASS: Record<string, string> = {
    OPEN: "bg-surface2 text-muted",
    PLANNED: "bg-amber/15 text-amber",
    DONE: "bg-lime/15 text-lime",
    DECLINED: "bg-rose/15 text-rose",
  };

  const suggestions = await prisma.suggestion.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-16">
      <div className="flex items-center gap-2 mb-2 animate-fade-up">
        <Lightbulb size={16} className="text-lime" />
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-dim">{t("kicker")}</span>
      </div>
      <h1 className="font-display text-4xl mb-6 font-extrabold text-ink tracking-tight animate-fade-up" style={{ animationDelay: "60ms" }}>
        {t("title")}
      </h1>

      {session ? (
        <div className="mb-8">
          <SuggestionForm />
        </div>
      ) : (
        <div className="card p-4 mb-8 text-xs text-muted">
          <Link href="/login" className="text-lime font-bold">
            {t("loginCta")}
          </Link>{" "}
          {t("loginSuffix")}
        </div>
      )}

      <Eyebrow>{t("allSuggestions")}</Eyebrow>
      {suggestions.length === 0 && <div className="card p-6 text-center text-xs text-dim">{t("empty")}</div>}
      <div className="grid sm:grid-cols-2 gap-2">
        {suggestions.map((s) => (
          <div key={s.id} className="card p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-ink">{s.user.username ?? s.user.name ?? t("anonymousUser")}</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold font-mono ${STATUS_CLASS[s.status]}`}>
                {STATUS_LABEL[s.status]}
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

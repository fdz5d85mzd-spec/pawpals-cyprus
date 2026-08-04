import { Star } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Eyebrow } from "@/components/predictor/ui";
import { ReviewForm } from "@/components/ReviewForm";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={rating >= n ? "fill-lime text-lime" : "text-dim"} />
      ))}
    </div>
  );
}

export default async function ReviewsPage() {
  const session = await getServerSession(authOptions);

  const [reviews, myReview] = await Promise.all([
    prisma.siteReview.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    session?.user?.id ? prisma.siteReview.findUnique({ where: { userId: session.user.id } }) : null,
  ]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="max-w-xl mx-auto px-5 pt-8 pb-16">
      <div className="flex items-center gap-2 mb-2 animate-fade-up">
        <Star size={16} className="text-lime fill-lime" />
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-dim">Αξιολογήσεις</span>
      </div>
      <h1 className="font-display text-4xl mb-6 font-extrabold text-ink tracking-tight animate-fade-up" style={{ animationDelay: "60ms" }}>
        Τι λένε οι χρήστες
      </h1>

      <div className="card p-6 mb-8 flex items-center gap-5 animate-fade-up" style={{ animationDelay: "120ms" }}>
        <div className="font-display text-5xl font-mono text-gradient">{avg.toFixed(1)}</div>
        <div>
          <Stars rating={Math.round(avg)} size={16} />
          <div className="text-xs text-muted mt-1">{reviews.length} αξιολογήσεις</div>
        </div>
      </div>

      <Eyebrow>{myReview ? "Ενημέρωσε την αξιολόγησή σου" : "Άφησε την αξιολόγησή σου"}</Eyebrow>
      {session ? (
        <div className="mb-8">
          <ReviewForm initialRating={myReview?.rating} initialBody={myReview?.body ?? undefined} />
        </div>
      ) : (
        <div className="card p-4 mb-8 text-xs text-muted">
          <Link href="/login" className="text-lime font-bold">
            Συνδέσου
          </Link>{" "}
          για να αφήσεις αξιολόγηση.
        </div>
      )}

      <Eyebrow>Όλες οι αξιολογήσεις</Eyebrow>
      <div className="space-y-2">
        {reviews.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-ink">{r.user.name ?? "Χρήστης"}</span>
              <Stars rating={r.rating} />
            </div>
            {r.body && <p className="text-xs text-muted leading-relaxed">{r.body}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

// Standalone overlay for a YouTube Live "watch the users grow" stream —
// always English regardless of site locale (the audience for a public
// livestream number-go-up challenge is international), and deliberately
// minimal so it can be cropped as an OBS Browser Source without the site's
// nav/footer getting in the way.
export default function LiveCounterPage() {
  const [count, setCount] = useState<number | null>(null);
  const [prevCount, setPrevCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/user-count");
        const data = await res.json();
        if (!cancelled) {
          setCount((current) => {
            if (current !== null && current !== data.count) setPrevCount(current);
            return data.count;
          });
        }
      } catch {
        // A missed tick isn't worth surfacing on a stream overlay — it'll
        // just pick the right number up again next poll.
      }
    }

    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const bumped = prevCount !== null && count !== null && count > prevCount;

  return (
    <div className="min-h-screen w-full bg-bg flex flex-col items-center justify-center gap-6">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 bg-lime text-bg font-display font-extrabold text-base flex items-center justify-center">
          S
        </span>
        <span className="font-display font-extrabold text-xl text-ink tracking-tight uppercase">Skorama</span>
      </div>

      <div className="text-xs uppercase tracking-[0.3em] font-mono text-dim">Live user count challenge</div>

      <div
        className={`font-mono font-bold text-ink tabular-nums transition-transform duration-300 ${
          bumped ? "scale-110 text-lime" : ""
        }`}
        style={{ fontSize: "min(28vw, 260px)", lineHeight: 1 }}
      >
        {count ?? "—"}
      </div>

      <div className="text-sm text-muted">users signed up on skorama.xyz — join the challenge!</div>
    </div>
  );
}

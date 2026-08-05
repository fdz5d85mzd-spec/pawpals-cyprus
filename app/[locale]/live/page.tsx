"use client";

import { useEffect, useState } from "react";

// Full-screen "watch the users grow" stream visual — always English
// regardless of site locale (the audience for a public livestream
// number-go-up challenge is international). Meant to be the entire stream
// picture (captured full-screen in OBS), not a transparent overlay, so it
// carries the same bold brand look as the rest of the site.
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
    <div className="relative min-h-screen w-full bg-bg overflow-hidden flex flex-col items-center justify-center gap-8">
      <div className="absolute -top-40 -right-32 w-[560px] h-[560px] bg-lime" style={{ transform: "rotate(24deg)" }} />
      <div className="absolute -bottom-40 -left-32 w-[420px] h-[420px] bg-lime/20" style={{ transform: "rotate(24deg)" }} />

      <div className="relative flex items-center gap-3">
        <span className="w-12 h-12 bg-lime text-bg font-display font-extrabold text-2xl flex items-center justify-center">
          S
        </span>
        <span className="font-display font-extrabold text-3xl text-ink tracking-tight uppercase">Skorama</span>
      </div>

      <div className="relative bg-lime text-bg font-display font-extrabold text-lg uppercase tracking-wide px-6 py-2 -skew-x-6">
        <span className="inline-block skew-x-6">Live User Count Challenge</span>
      </div>

      <div
        className={`relative font-mono font-bold text-ink tabular-nums transition-transform duration-300 ${
          bumped ? "scale-110 text-lime" : ""
        }`}
        style={{ fontSize: "min(30vw, 320px)", lineHeight: 1 }}
      >
        {count ?? "—"}
      </div>

      <div className="relative text-lg text-muted">
        users signed up on <span className="text-lime font-bold">skorama.xyz</span> — join the challenge!
      </div>

      <div className="relative text-xs uppercase tracking-[0.3em] text-dim mt-2">
        Statistical football predictions · Not a betting service
      </div>
    </div>
  );
}

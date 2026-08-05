"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Gift } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";

function formatRemaining(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}ω ${minutes}λ`;
  return `${minutes}λ`;
}

export function TrialBanner() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const trialEndsAt = session?.user?.trialEndsAt;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!trialEndsAt) return;
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, [trialEndsAt]);

  if (pathname === "/live" || !trialEndsAt) return null;

  const remainingMs = new Date(trialEndsAt).getTime() - now;
  if (remainingMs <= 0) return null;

  return (
    <div className="bg-lime text-bg text-xs font-bold">
      <div className="max-w-6xl mx-auto px-5 py-2 flex items-center justify-center gap-2 text-center flex-wrap">
        <Gift size={14} />
        <span>
          Έχεις δωρεάν πρόσβαση Pro για {formatRemaining(remainingMs)} ακόμα — δοκίμασε όλα τα features πριν λήξει.
        </span>
        <Link href="/pricing" className="underline underline-offset-2">
          Κλείδωσέ το με συνδρομή →
        </Link>
      </div>
    </div>
  );
}

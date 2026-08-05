"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { usePathname } from "@/i18n/navigation";

const DISMISS_KEY = "skorama_install_banner_dismissed_at";
const RESHOW_AFTER_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks
const SHOW_DELAY_MS = 4000;

// Chrome/Edge/Android fire this before showing their own install UI — we
// stash it so our banner's button can trigger the native prompt on demand
// instead of Chrome's small, easy-to-miss address-bar icon.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function InstallAppBanner() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname === "/live" || isStandalone()) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (Date.now() - dismissedAt < RESHOW_AFTER_MS) return;

    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIsIOS(ios);

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // iOS never fires beforeinstallprompt — show the manual-instructions
    // version anyway since it's the only route to install there.
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [pathname]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    setDeferredPrompt(null);
  }

  if (!visible || (!isIOS && !deferredPrompt)) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t-2 border-lime bg-surface">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <span className="w-9 h-9 shrink-0 bg-lime text-bg font-display font-extrabold text-sm flex items-center justify-center rounded-md">
          S
        </span>
        <div className="flex-1 min-w-0 text-xs text-ink">
          {isIOS ? (
            <>
              <span className="font-bold">Πρόσθεσε το Skorama στην Αρχική Οθόνη</span>
              <span className="text-muted"> — πάτα το </span>
              <Share size={12} className="inline -mt-0.5" />
              <span className="text-muted"> Κοινή χρήση και μετά &quot;Προσθήκη στην Αρχική Οθόνη&quot;.</span>
            </>
          ) : (
            <span className="font-bold">Εγκατάστησε το Skorama σαν εφαρμογή στη συσκευή σου</span>
          )}
        </div>
        {!isIOS && (
          <button onClick={install} className="btn-primary shrink-0 !px-3 !py-1.5 gap-1.5">
            <Download size={13} />
            Εγκατάσταση
          </button>
        )}
        <button onClick={dismiss} aria-label="Κλείσιμο" className="shrink-0 text-dim hover:text-ink transition-colors p-1">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

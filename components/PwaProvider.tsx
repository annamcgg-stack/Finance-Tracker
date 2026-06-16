"use client";

import { APP_NAME, APP_PWA_INSTALL_LINE } from "@/lib/branding";
import { useEffect, useState, useCallback } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/Field";
import { AppLogo } from "@/components/branding/AppLogo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (process.env.NODE_ENV !== "production") return;

  navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
    console.warn("Service worker registration failed:", err);
  });
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    registerServiceWorker();

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const onInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onInstallPrompt);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }, [installPrompt]);

  const showBanner = installPrompt && !dismissed && !isStandalone;

  return (
    <>
      {children}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm sm:rounded-xl sm:border">
          <div className="flex items-start gap-3">
            <AppLogo size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Install {APP_NAME}</p>
              <p className="mt-0.5 text-xs text-muted">{APP_PWA_INSTALL_LINE}</p>
              <div className="mt-3 flex gap-2">
                <Button type="button" size="sm" onClick={handleInstall}>
                  <Download className="h-4 w-4" /> Install
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setDismissed(true)}>
                  Not now
                </Button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="shrink-0 rounded-lg p-2 text-muted hover:bg-surface-elevated"
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

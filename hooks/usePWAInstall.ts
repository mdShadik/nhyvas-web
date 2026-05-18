"use client";

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
  }>;
}

const PWA_DISMISSED_KEY = "pwa_install_dismissed";
const PWA_INSTALLED_KEY = "pwa_install_accepted";

function getStoredBool(key: string, defaultValue = false): boolean {
  if (typeof window === "undefined") return defaultValue;
  return localStorage.getItem(key) === "true";
}

function setStoredBool(key: string, value: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, String(value));
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isInstallable, setIsInstallable] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);
  const [hasInstalled, setHasInstalled] = useState(false);

  // Check storage on mount (client-side only)
  useEffect(() => {
    setHasDismissed(getStoredBool(PWA_DISMISSED_KEY));
    setHasInstalled(getStoredBool(PWA_INSTALLED_KEY));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();

      // Don't show if already dismissed or installed
      const dismissed = getStoredBool(PWA_DISMISSED_KEY);
      const installed = getStoredBool(PWA_INSTALLED_KEY);

      if (!dismissed && !installed) {
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setIsInstallable(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();

    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setStoredBool(PWA_INSTALLED_KEY, true);
      setHasInstalled(true);
      setIsInstallable(false);
    }

    setDeferredPrompt(null);
    return choice.outcome === "accepted";
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setStoredBool(PWA_DISMISSED_KEY, true);
    setHasDismissed(true);
    setIsInstallable(false);
  }, []);

  const canPrompt = isInstallable && !hasDismissed && !hasInstalled;

  return {
    isInstallable: canPrompt,
    install,
    dismiss,
    hasInstalled,
  };
}
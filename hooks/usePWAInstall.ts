"use client";

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa_dismissed";
const INSTALLED_KEY = "pwa_installed";

function isIOSDevice() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function getStored(key: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(key) === "true";
}

function setStored(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, String(value));
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isIOS, setIsIOS] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [hasInstalled, setHasInstalled] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  /**
   * INIT STORAGE + PLATFORM CHECK
   */
  useEffect(() => {
    setIsIOS(isIOSDevice());
    setHasInstalled(getStored(INSTALLED_KEY));
    setHasDismissed(getStored(DISMISSED_KEY));
  }, []);

  /**
   * LISTEN FOR INSTALL PROMPT (ANDROID / CHROME ONLY)
   */
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();

      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  /**
   * INSTALL ACTION
   */
  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setStored(INSTALLED_KEY, true);
      setHasInstalled(true);
      setIsInstallable(false);
    }

    setDeferredPrompt(null);
    return choice.outcome === "accepted";
  }, [deferredPrompt]);

  /**
   * DISMISS ACTION
   */
  const dismiss = useCallback(() => {
    setStored(DISMISSED_KEY, true);
    setHasDismissed(true);
    setIsInstallable(false);
  }, []);

  /**
   * FINAL COMPUTED STATE
   */
  const canInstall =
    isInstallable && !hasInstalled && !hasDismissed && !isIOS;

  return {
    isIOS,
    install,
    dismiss,
    hasInstalled,
    isInstallable: canInstall,
  };
}
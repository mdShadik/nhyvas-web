"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";

import { usePWAInstall } from "@/hooks/usePWAInstall";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

type Props = {
  delaySeconds?: number;
  className?: string;
};

const DISMISS_KEY = "nhyvas-pwa-dismissed";

export function PWAInstallPrompt({
  delaySeconds = 20,
  className,
}: Props) {
  const { t } = useTranslation();

  const { isInstallable, install, hasInstalled } =
    usePWAInstall();

  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  /**
   * Mobile detection
   */
  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;

    return /Android|iPhone|iPad|iPod/i.test(
      window.navigator.userAgent
    );
  }, []);

  /**
   * Detect standalone mode
   */
  const isStandalone = useMemo(() => {
    if (typeof window === "undefined") return false;

    return window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
  }, []);

  /**
   * Prompt interval
   */
  const promptIntervalMinutes = Number(
    process.env
      .NEXT_PUBLIC_PWA_PROMPT_INTERVAL_MINUTES || 2880
  );

  const promptIntervalMs =
    promptIntervalMinutes * 60 * 1000;

  /**
   * Delayed prompt
   */
  useEffect(() => {
    if (!isClient) return;
    if (!isMobile) return;
    if (isStandalone) return;
    if (hasInstalled) return;
    if (!isInstallable) return;

    const dismissedAt =
      localStorage.getItem(DISMISS_KEY);

    if (dismissedAt) {
      const shouldWait =
        Date.now() - Number(dismissedAt) <
        promptIntervalMs;

      if (shouldWait) {
        return;
      }
    }

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, delaySeconds * 1000);

    return () => clearTimeout(timer);
  }, [
    isClient,
    isMobile,
    isStandalone,
    hasInstalled,
    isInstallable,
    delaySeconds,
    promptIntervalMs,
  ]);

  /**
   * Install app
   */
  const handleInstall = async () => {
    const accepted = await install();

    if (accepted) {
      setIsOpen(false);

      localStorage.setItem(
        "nhyvas-pwa-installed",
        "true"
      );
    }
  };

  /**
   * Dismiss prompt
   */
  const handleDismiss = () => {
    localStorage.setItem(
      DISMISS_KEY,
      String(Date.now())
    );

    setIsOpen(false);
  };

  /**
   * Don't render
   */
  if (
    !isClient ||
    !isMobile ||
    isStandalone ||
    hasInstalled
  ) {
    return null;
  }

  return (
    <MobileBottomSheet
      open={isOpen}
      onClose={handleDismiss}
      title={t("pwa.title")}
      description={t("pwa.description")}
      snapPoints={[0, 0.5]}
      initialSnap={1}
      showCloseButton
      className={clsx("",className)}
    >
      <div className="flex flex-col items-center text-center p-2">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-500/10">
          <Download className="h-8 w-8 text-primary-500" />
        </div>

        <p className="mb-6 text-sm leading-relaxed text-text-secondary">
          {t("pwa.message")}
        </p>

        <div className="grid w-full grid-cols-1 gap-2">
          <Button
            onClick={handleInstall}
            className="h-11 rounded-2xl bg-linear-to-br from-primary-500 via-primary-500 to-tertiary-500"
          >
            <Download className="mr-2 h-4 w-4" />

            {t("pwa.install")}
          </Button>

          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="h-11 rounded-2xl"
          >
            {t("pwa.later")}
          </Button>
        </div>
      </div>
    </MobileBottomSheet>
  );
}
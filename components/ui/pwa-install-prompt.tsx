"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Share } from "lucide-react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { usePWAInstall } from "@/hooks/usePWAInstall";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { Button } from "@/components/ui/button";

type Props = {
  delaySeconds?: number;
  className?: string;
  openTrigger?: boolean;
  onCloseTrigger?: () => void;
};

const DISMISS_KEY = "pwa_dismissed_at";
const AUTO_SHOWN_KEY = "pwa_auto_shown";

export function PWAInstallPrompt({
  delaySeconds = 20,
  className,
  openTrigger,
  onCloseTrigger,
}: Props) {
  const { t } = useTranslation();
  const { install, isIOS, hasInstalled } = usePWAInstall();

  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  /**
   * DEVICE CHECKS
   */
  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }, []);

  const isStandalone = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(display-mode: standalone)").matches;
  }, []);

  /**
   * OPEN MODAL (single control)
   */
  const openModal = () => {
    if (isStandalone || hasInstalled) return;
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    onCloseTrigger?.();
  };

  /**
   * MANUAL TRIGGER (Profile button etc.)
   */
  useEffect(() => {
    if (openTrigger) {
      openModal();
    }
  }, [openTrigger]);

  /**
   * AUTO TRIGGER (safe, one-time)
   */
  useEffect(() => {
    if (!isClient || !isMobile || isStandalone || hasInstalled) return;

    const alreadyShown = sessionStorage.getItem(AUTO_SHOWN_KEY);
    if (alreadyShown) return;

    const dismissedAt = localStorage.getItem(DISMISS_KEY);

    if (dismissedAt) {
      const cooldown = 1000 * 60 * 60 * 48; // 48 hours
      if (Date.now() - Number(dismissedAt) < cooldown) return;
    }

    const timer = setTimeout(() => {
      openModal();
      sessionStorage.setItem(AUTO_SHOWN_KEY, "true");
    }, delaySeconds * 1000);

    return () => clearTimeout(timer);
  }, [isClient, isMobile, isStandalone, hasInstalled, delaySeconds]);

  /**
   * INSTALL ACTION
   */
  const handleInstall = async () => {
    const accepted = await install();

    if (accepted) {
      setIsOpen(false);
      localStorage.setItem("pwa_installed", "true");
    }
  };

  /**
   * DISMISS ACTION
   */
  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    closeModal();
  };

  /**
   * BLOCK RENDER
   */
  if (!isClient || !isMobile || isStandalone || hasInstalled) {
    return null;
  }

  return (
    <MobileBottomSheet
      open={isOpen}
      onClose={handleDismiss}
      title={isIOS ? t("pwa.iosTitle") : t("pwa.title")}
      description={
        isIOS ? t("pwa.iosDescription") : t("pwa.description")
      }
      snapPoints={[0, 0.5, 1]}
      initialSnap={1}
      showCloseButton
      className={clsx("", className)}
    >
      <div className="flex flex-col items-center text-center p-2">
        {/* ICON */}
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-500/10">
          {isIOS ? (
            <Share className="h-8 w-8 text-primary-500" />
          ) : (
            <Download className="h-8 w-8 text-primary-500" />
          )}
        </div>

        {/* TEXT */}
        <p className="mb-6 text-sm text-text-secondary">
          {isIOS ? t("pwa.iosMessage") : t("pwa.message")}
        </p>

        <div className="w-full space-y-2">
          {/* ANDROID INSTALL */}
          {!isIOS ? (
            <div className="relative overflow-hidden rounded-2xl p-0.5">
              <div className="absolute inset-[-1000%] animate-spin bg-conic from-primary-500 via-tertiary-500 to-primary-500" />

              <div className="relative rounded-2xl">
                <Button
                  onClick={handleInstall}
                  className="h-11 w-full rounded-2xl bg-primary-500"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t("pwa.install")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center">
              Tap <strong>Share</strong> →{" "}
              <strong>Add to Home Screen</strong>
            </div>
          )}

          {/* DISMISS */}
          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="h-11 rounded-2xl w-full"
          >
            {t("pwa.later")}
          </Button>
        </div>
      </div>
    </MobileBottomSheet>
  );
}
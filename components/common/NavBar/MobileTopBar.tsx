"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import {
  darkLogo,
  lightLogo,
  logoSingleN,
  logoSingleNForLight,
} from "@/assets";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "../ThemeToggle";
import { LanguageToggle } from "../LanguageToggle";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { useNotificationsStore } from "@/stores/notificationsStore";
import { getUnreadCount } from "@/services/notifications";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { LoginModal } from "@/components/auth/LoginModal";

export default function LoginButton({
  loginText,
  onClick,
}: {
  loginText: string;
  onClick?: () => void;
}) {
  return (
    <div className="relative inline-flex h-9 overflow-hidden rounded-full p-[1.5px]">
      {/* animated border */}
      <motion.div
        className="absolute inset-[-250%] rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{
          background: `
            conic-gradient(
              from 0deg,
              var(--color-secondary-100) 0deg,
              var(--color-tertiary-400) 220deg,
              var(--color-secondary-100) 250deg,
              var(--color-tertiary-400) 285deg,
              var(--color-primary-100) 315deg,
              var(--color-tertiary-500) 340deg,
              var(--color-tertiary-500) 360deg
            )
          `,
        }}
      />

      <button
        type="button"
        onClick={onClick}
        className="relative z-10 flex h-full items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-primary-500 to-tertiary-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:opacity-95 cursor-pointer"
      >
        {/* soft top gloss overlay */}
        <span className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.20)_0%,rgba(255,255,255,0.08)_35%,rgba(255,255,255,0)_100%)]" />

        {/* shimmer sweep */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-[-40%] w-[40%] skew-x-[-20deg] bg-linear-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ["-120%", "280%"] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            repeatDelay: 0.7,
            ease: "easeInOut",
          }}
        />

        {/* subtle inner highlight */}
        <span className="pointer-events-none absolute inset-px rounded-full ring-1 ring-inset ring-white/10" />

        <span className="relative z-10">{loginText}</span>
      </button>
    </div>
  );
}

export function MobileTopBar() {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  const [mounted, setMounted] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initialLoadRef = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || initialLoadRef.current) return;
    initialLoadRef.current = true;
    void getUnreadCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, [isAuthenticated, setUnreadCount]);

  const logoUrl = !mounted
    ? lightLogo
    : theme === "dark"
      ? darkLogo
      : lightLogo;

  const singleNLogo = !mounted
    ? logoSingleNForLight
    : theme === "dark"
      ? logoSingleN
      : logoSingleNForLight;

  return (
    <>
      <div className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-border bg-linear-to-br dark:bg-linear-to-tl from-white/10 via-white-50 to-tertiary-50 dark:from-bg-page dark:via-primary-900/20 dark:to-tertiary-900/30 p-4 shadow-sm backdrop-blur-xl md:hidden transition-colors dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-(--accent)/20 to-transparent" />

        <Link href="/" className="hidden sm:flex items-center">
          <Image
            src={logoUrl}
            alt="Nhyvas"
            priority
            width={110}
            height={36}
            style={{ width: "auto", height: "auto" }}
            className="h-9 w-auto object-contain"
          />
        </Link>

        <Link href="/" className="flex sm:hidden items-center">
          <Image
            src={singleNLogo}
            alt="Nhyvas"
            priority
            width={40}
            height={30}
            className="object-contain"
          />
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />

          {isLoading ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-bg-input" />
          ) : isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => setNotifOpen(true)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-input text-text-secondary transition-colors hover:border-(--accent)/30 hover:text-text-primary"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </button>

              <MobileBottomSheet
                open={notifOpen}
                title=""
                onClose={() => setNotifOpen(false)}
                showCloseButton={false}
              >
                <NotificationsPanel onClose={() => setNotifOpen(false)} />
              </MobileBottomSheet>
            </>
          ) : (
            <LoginButton
              loginText={t("common.login")}
              onClick={() => setLoginOpen(true)}
            />
          )}
        </div>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

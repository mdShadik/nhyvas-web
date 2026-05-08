"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell, User } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { darkLogo, lightLogo } from "@/assets";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "../ThemeToggle";
import { LanguageToggle } from "../LanguageToggle";
import { useTranslation } from "react-i18next";

export function MobileTopBar() {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const logoUrl = theme === "dark" ? darkLogo : lightLogo;

  return (
    <div className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-card)]/80 px-4 shadow-sm backdrop-blur-xl md:hidden transition-colors dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/20 to-transparent" />
      
      <Link href="/" className="flex items-center">
        <Image
          src={logoUrl}
          alt="Nhyvas"
          priority
          width={110}
          height={36}
          className="h-9 w-auto object-contain"
        />
      </Link>
      
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
        
        {isLoading ? (
          <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--color-bg-input)]" />
        ) : isAuthenticated ? (
          <Link
            href="/notifications"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--accent)]/30 hover:text-[var(--color-text-primary)]"
          >
            <Bell className="h-4.5 w-4.5" />
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex h-9 items-center justify-center rounded-full bg-[var(--accent)] px-4 text-xs font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            {t("common.login")}
          </Link>
        )}
      </div>
    </div>
  );
}

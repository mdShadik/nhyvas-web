"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

import { env } from "@/lib/env";
import { useTheme } from "@/context/ThemeContext";
import { darkLogo, lightLogo } from "@/assets";

type Props = {
  nextUrl?: string | null;
  onClose?: () => void;
  title?: string;
  description?: string;
};

export function LoginCard({
  nextUrl,
  onClose,
  title,
  description,
}: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeNextUrl = useMemo(() => {
    const raw = (nextUrl ?? "").trim();
    if (!raw) return "";
    return raw.startsWith("/") ? raw : "";
  }, [nextUrl]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey);
      const redirectTo = `${window.location.origin}/login${safeNextUrl ? `?next=${encodeURIComponent(safeNextUrl)}` : ""}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err?.message ?? t("auth.authentication_failed", "Authentication failed"));
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-linear-to-br from-white via-white dark:from-primary-900/30 dark:via-secondary-900/40 dark:to-tertiary-900/50 to-tertiary-50 p-6 shadow-xl sm:p-8">
      <div className="relative mb-8 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Image 
            src={darkLogo} 
            alt="Nhyvas" 
            width={112} 
            height={34} 
            unoptimized
            style={{ width: "auto", height: "auto" }} 
            className={`h-8 w-auto object-contain ${theme === 'light' ? "hidden" : "block"}`} 
          />
          <Image 
            src={lightLogo} 
            alt="Nhyvas" 
            width={112} 
            height={34} 
            unoptimized
            style={{ width: "auto", height: "auto" }} 
            className={`h-8 w-auto object-contain ${theme === 'light' ? "block" : "hidden"}`} 
          />
        </div>
        
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-input text-text-secondary transition-all hover:bg-secondary-100 hover:text-text-primary active:scale-95 dark:hover:bg-secondary-800"
            aria-label={t("common.close", "Close")}
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="mb-7 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          {title ?? t("auth.welcome_back", "Welcome back")}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {description ?? t("auth.sign_in_desc", "Sign in to continue")}
        </p>
      </div>

      {error ? (
        <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-border px-4 py-3.5 text-base font-medium text-text-primary shadow-sm transition hover:bg-tertiary-50 disabled:opacity-60 dark:hover:bg-tertiary-900/20"
      >
        {loading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        {loading ? t("auth.redirecting", "Redirecting...") : t("auth.continue_with_google", "Continue with Google")}
      </button>

      <div className="mt-7 text-center text-sm text-text-secondary">
        {t("auth.agree_prefix", "By continuing you agree to")}{" "}
        <Link href="/terms" className="font-medium text-(--accent) hover:underline">
          {t("common.terms", "Terms")}
        </Link>{" "}
        {t("common.and", "and")}{" "}
        <Link href="/privacy" className="font-medium text-(--accent) hover:underline">
          {t("common.privacy", "Privacy")}
        </Link>
        .
      </div>
    </div>
  );
}

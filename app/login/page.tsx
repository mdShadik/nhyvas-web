"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { darkLogo, lightLogo } from "../../assets";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const logoUrl = theme === "dark" ? darkLogo : lightLogo;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setLoading(true);
        // Send the session to our server route to set cookies
        fetch("/api/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session }),
        })
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              if (typeof window !== "undefined") {
                window.location.href = data.onboard ? "/onboard" : "/";
              }
            } else {
              setError(t("auth.server_session_failed"));
              setLoading(false);
            }
          })
          .catch((err) => {
            setError(err.message);
            setLoading(false);
          });
      }
    });

    // Check for error in URL hash or search string
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const search = window.location.search;
      if (hash.includes("error_description=")) {
        const params = new URLSearchParams(hash.replace("#", "?"));
        setError(params.get("error_description")?.replace(/\+/g, " ") || t("auth.authentication_failed"));
      } else if (search.includes("error=")) {
        const params = new URLSearchParams(search);
        setError(params.get("error") || t("auth.authentication_failed"));
      }
    }

    return () => subscription.unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
      // The browser will be redirected to Google automatically
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-indigo-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">

      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-(--surface) p-6 shadow-xl sm:p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              {t("auth.welcome_back")}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              {t("auth.sign_in_desc")}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-(--surface) px-4 py-3.5 text-base font-medium text-text-primary shadow-sm transition hover:bg-zinc-50 disabled:opacity-50 dark:hover:bg-zinc-800/50"
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
              {loading ? t("auth.redirecting") : t("auth.continue_with_google")}
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-text-secondary">
            {t("auth.agree_prefix")}{" "}
            <Link href="/terms" className="font-medium text-(--accent) hover:underline">
              {t("common.terms")}
            </Link>{" "}
            {t("common.and")}{" "}
            <Link href="/privacy" className="font-medium text-(--accent) hover:underline">
              {t("common.privacy")}
            </Link>
            .
          </div>
        </div>
      </main>
    </div>
  );
}

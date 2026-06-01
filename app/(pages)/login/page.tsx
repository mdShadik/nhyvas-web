"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { useTranslation } from "react-i18next";
import { LoginCard } from "@/components/auth/LoginCard";
import { PageLoading } from "@/components/common/PageLoading";

export default function LoginPage() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    const next = (params.get("next") ?? "").trim();
    return next.startsWith("/") ? next : "";
  }, []);

  const sessionExpired = useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("expired") === "true";
  }, []);

  useEffect(() => {
    if (sessionExpired) {
      setError(t("auth.session_expired") || "Your session has expired. Please login again.");
    }
  }, [sessionExpired, t]);

  useEffect(() => {
    if (env.useNhyvasAuth) {
      return;
    }

    const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setLoading(true);
        fetch("/api/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session }),
        })
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              if (typeof window !== "undefined") {
                window.location.href = data.onboard ? "/onboard" : nextUrl || "/";
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
  }, [nextUrl, t]);

  return (
    <div className="flex min-h-[calc(100vh-64px)] sm:min-h-screen flex-col">
      {loading && <PageLoading />}
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          {error ? (
            <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : null}
          <LoginCard
            nextUrl={nextUrl}
            title={t("auth.welcome_back")}
            description={t("auth.sign_in_desc")}
            onAuthSuccess={({ onboard }) => {
              setLoading(true);
              window.location.href = onboard ? "/onboard" : nextUrl || "/";
            }}
          />
        </div>
      </main>
    </div>
  );
}

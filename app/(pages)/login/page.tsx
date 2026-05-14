"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { useTranslation } from "react-i18next";
import { LoginCard } from "@/components/auth/LoginCard";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    const next = (params.get("next") ?? "").trim();
    return next.startsWith("/") ? next : "";
  }, []);

  // Check for session expired message
  const sessionExpired = useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("expired") === "true";
  }, []);

  useEffect(() => {
    // Show session expired message
    if (sessionExpired) {
      setError(t("auth.session_expired") || "Your session has expired. Please login again.");
    }
  }, [sessionExpired, t]);

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
                if (data.onboard) {
                  window.location.href = "/onboard";
                } else {
                  window.location.href = nextUrl || "/";
                }
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
  }, [router, nextUrl, t]);

  return (
    <div className="flex min-h-[calc(100vh-64px)] sm:min-h-screen flex-col">

      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          {error ? (
            <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : null}
          <LoginCard nextUrl={nextUrl} title={t("auth.welcome_back")} description={t("auth.sign_in_desc")} />
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoginCard } from "@/components/auth/LoginCard";
import { PageLoading } from "@/components/common/PageLoading";

export default function LoginPage() {
  const { t } = useTranslation();
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4 py-10">
      {error ? (
        <div className="absolute top-6 left-1/2 z-10 w-full max-w-md -translate-x-1/2 rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}
      <LoginCard nextUrl={nextUrl} />
    </div>
  );
}

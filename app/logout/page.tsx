"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { useTranslation } from "react-i18next";

export default function LogoutPage() {
  const { t } = useTranslation();

  useEffect(() => {
    const performLogout = async () => {
      // 1. Clear Supabase local storage session
      const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey);
      await supabase.auth.signOut();

      // 2. Clear secure HttpOnly cookies
      await fetch("/api/auth/logout", { method: "POST" });

      // 3. Redirect to login
      window.location.href = "/login";
    };

    performLogout();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface)]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent" />
        <p className="text-[var(--color-text-secondary)]">{t("auth.logging_out")}</p>
      </div>
    </div>
  );
}

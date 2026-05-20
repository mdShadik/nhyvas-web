"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LogoutPage() {
  const { t } = useTranslation();

  useEffect(() => {
    const performLogout = async () => {
      // Clear client-side Supabase session (localStorage) first.
      await supabaseBrowser.auth.signOut().catch(() => null);

      // Clear secure HttpOnly cookies (used by server/middleware auth checks).
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);

      // Redirect to login
      window.location.href = "/login";
    };

    performLogout();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-(--accent) border-t-transparent" />
        <p className="text-text-secondary">{t("auth.logging_out")}</p>
      </div>
    </div>
  );
}

"use client";

import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function LogoutPage() {
  const { t } = useTranslation();

  useEffect(() => {
    const performLogout = async () => {
      // Clear secure HttpOnly cookies (source of truth for web auth).
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
       await supabaseBrowser.auth.signOut().catch(() => null);
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

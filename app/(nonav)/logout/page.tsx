"use client";

import { env } from "@/lib/env";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { clearWebToken } from "@/services/apiService/http";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function LogoutPage() {
  const { t } = useTranslation();

  useEffect(() => {
    const performLogout = async () => {
      const params = new URLSearchParams(window.location.search);
      const isExpired = params.get("expired") === "true";

      if (env.useNhyvasAuth) {
        clearWebToken();
      } else {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
        await supabaseBrowser.auth.signOut().catch(() => null);
      }

      // Redirect to login, preserving expired state
      window.location.href = isExpired ? "/login?expired=true" : "/login";
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

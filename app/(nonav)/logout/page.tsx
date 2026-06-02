"use client";

import { clearWebToken, requestJson } from "@/services/apiService/http";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function LogoutPage() {
  const { t } = useTranslation();

  useEffect(() => {
    const performLogout = async () => {
      const params = new URLSearchParams(window.location.search);
      const isExpired = params.get("expired") === "true";

      clearWebToken();
      await requestJson("/api/auth/logout", { method: "POST" }).catch(() => null);

      window.location.href = isExpired ? "/login?expired=true" : "/login";
    };

    void performLogout();
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

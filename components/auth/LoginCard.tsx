"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

import { env } from "@/lib/env";
import { nhyvasFetchMe, nhyvasGoogleLogin } from "@/lib/nhyvasApi";
import { setRefreshToken, setWebToken } from "@/services/apiService/http";
import { useTheme } from "@/context/ThemeContext";
import { darkLogo, lightLogo } from "@/assets";

type Props = {
  nextUrl?: string | null;
  onClose?: () => void;
  title?: string;
  description?: string;
  onAuthSuccess?: (payload: { onboard: boolean }) => void;
};

export function LoginCard({
  nextUrl,
  onClose,
  title,
  description,
  onAuthSuccess,
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

  const finishLogin = (onboard: boolean) => {
    if (onAuthSuccess) {
      onAuthSuccess({ onboard });
      return;
    }
    if (typeof window !== "undefined") {
      window.location.href = onboard ? "/onboard" : safeNextUrl || "/";
    }
  };

  const handleNhyvasGoogleSuccess = async (response: CredentialResponse) => {
    const idToken = response.credential;
    if (!idToken) {
      setError(t("auth.authentication_failed", "Authentication failed"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { token, refresh_token } = await nhyvasGoogleLogin(idToken);
      setWebToken(token);
      if (refresh_token) setRefreshToken(refresh_token);
      const me = await nhyvasFetchMe();
      finishLogin(!me.is_onboarded);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("auth.authentication_failed", "Authentication failed");
      setError(message);
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
            style={{ width: "auto", height: "auto" }}
            className={`h-8 w-auto object-contain ${theme === "light" ? "hidden" : "block"}`}
          />
          <Image
            src={lightLogo}
            alt="Nhyvas"
            width={112}
            height={34}
            style={{ width: "auto", height: "auto" }}
            className={`h-8 w-auto object-contain ${theme === "light" ? "block" : "hidden"}`}
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

      <div className="flex w-full justify-center">
        <div className={loading ? "pointer-events-none opacity-60" : ""}>
          <GoogleLogin
            onSuccess={handleNhyvasGoogleSuccess}
            onError={() => {
              setError(t("auth.authentication_failed", "Authentication failed"));
              setLoading(false);
            }}
            theme={theme === "dark" ? "filled_black" : "outline"}
            size="large"
            text="continue_with"
            shape="pill"
            width="320"
          />
        </div>
      </div>

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

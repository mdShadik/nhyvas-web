"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { AvatarUpload } from "@/components/common/AvatarUpload";
import { useTheme } from "@/context/ThemeContext";

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { darkLogo, lightLogo } from "../../assets";
import { useTranslation } from "react-i18next";

export default function OnboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const logoUrl = theme === "dark" ? darkLogo : lightLogo;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile/bootstrap", { method: "POST" });
        if (!res.ok) throw new Error("Failed to load profile");

        const { data } = await res.json();
        const profile = data?.row;

        if (profile?.is_onboarded) {
          window.location.href = "/";
          return;
        }

        // Fetch Google OAuth metadata directly from the active session
        const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey);
        const { data: { user } } = await supabase.auth.getUser();

        const metaFullName = user?.user_metadata?.full_name || user?.user_metadata?.name;
        const metaAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
        const metaEmail = user?.email;

        // Prefill using user_metadata first, fallback to profile
        if (metaFullName || profile?.full_name) setFullName(metaFullName || profile.full_name);
        if (metaEmail || profile?.email) setEmail(metaEmail || profile.email);
        if (metaAvatar || profile?.avatar_url) setAvatarUrl(metaAvatar || profile.avatar_url);

      } catch (err: any) {
        setError(t("auth.profile_load_failed"));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError(t("auth.fullname_required"));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/profile/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, avatarUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t("auth.onboard_failed"));
      }

      // Save to local storage as requested
      if (typeof window !== "undefined") {
        localStorage.setItem("user_email", email);
        localStorage.setItem("user_name", fullName);
        localStorage.setItem("remoteTranslationsKey", "default");
      }

      window.location.href = "/";
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-indigo-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-(--accent) border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-indigo-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <header className="flex items-center justify-between p-4 sm:p-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src={logoUrl.src} alt="Nhyvas" width={120} height={60} />
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-(--surface) p-6 shadow-xl sm:p-8">
          <div className="mb-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              {t("auth.complete_profile")}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              {t("auth.add_details")}
            </p>
          </div>

          <AvatarUpload
            currentAvatarUrl={avatarUrl}
            onAvatarChange={setAvatarUrl}
            className="mb-6"
          />

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-text-primary">
                {t("auth.full_name")} <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("auth.full_name_placeholder")}
                className="w-full rounded-2xl border border-border bg-bg-input px-4 py-3.5 text-base text-text-primary placeholder-placeholder outline-none transition ring-(--accent)/20 focus:border-(--accent) focus:ring-4"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-text-primary">
                {t("common.email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="w-full cursor-not-allowed rounded-2xl border border-border bg-border/30 px-4 py-3.5 text-base text-text-secondary outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !fullName.trim()}
              className="mt-6 flex w-full items-center justify-center rounded-2xl bg-(--accent) px-4 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-(--accent)/90 disabled:opacity-50"
            >
              {submitting ? t("common.saving") : t("common.continue")}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

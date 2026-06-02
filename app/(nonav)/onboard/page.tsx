"use client";

import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
import { AvatarUpload } from "@/components/common/AvatarUpload";
// import { useTheme } from "@/context/ThemeContext";
import { profileService } from "@/services/apiService/profile";
import { requestJson } from "@/services/apiService/http";
import { useAuth } from "@/context/AuthContext";
// import { darkLogo, lightLogo } from "../../../assets";
import { useTranslation } from "react-i18next";

export default function OnboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  // const router = useRouter();
  // const { theme } = useTheme();
  // const logoUrl = theme === "dark" ? darkLogo : lightLogo;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const bootstrap = await profileService.getBootstrap();
        const profile = bootstrap?.profile;

        if (profile?.is_onboarded) {
          window.location.href = "/";
          return;
        }

        const metaFullName = user?.user_metadata?.full_name;
        const metaEmail = user?.email;
        if (metaFullName || profile?.full_name) setFullName(metaFullName || profile?.full_name || "");
        if (metaEmail || profile?.email) setEmail(metaEmail || profile?.email || "");
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);

      } catch (err: any) {
        setError(t("auth.profile_load_failed"));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const processAvatar = async (url: string | null) => {
    if (!url || !url.startsWith("http")) return url;
    
    try {
      const data = await requestJson<{ publicUrl?: string }>("/api/media/proxy-avatar", {
        method: "POST",
        body: JSON.stringify({ avatarUrl: url }),
      });
      return data?.publicUrl ?? url;
    } catch (e) {
      console.error("Failed to proxy avatar", e);
      return url;
    }
  };

  const handleFormSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    let finalAvatarUrl = avatarUrl;
    if (avatarUrl && avatarUrl.startsWith("http")) {
       finalAvatarUrl = await processAvatar(avatarUrl);
    }
    
    await handleSubmitInternal(e, finalAvatarUrl);
  };
  
  const handleSubmitInternal = async (e: React.FormEvent, finalAvatarUrl: string | null) => {
    if (!fullName.trim()) {
      setError(t("auth.fullname_required"));
      setSubmitting(false);
      return;
    }

    try {
      await requestJson("/api/profile/complete-onboarding", {
        method: "POST",
        body: JSON.stringify({ fullName, email, avatarUrl: finalAvatarUrl }),
      });

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
      <div className="flex min-h-screen items-center justify-center ">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-(--accent) border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col ">

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

          <form onSubmit={handleFormSubmit} className="space-y-5">
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
              className="mt-6 flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-primary-600 to-tertiary-600/50 px-4 py-3.5 text-base font-semibold dark:text-secondary-50 text-tertiary-900 hover:text-white  shadow-sm transition hover:bg-(--accent)/90 disabled:opacity-50"
            >
              {submitting ? t("common.saving") : t("common.continue")}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

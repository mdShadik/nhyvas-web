"use client";

import { RequireAuth } from "@/components/profile/RequireAuth";
import { ProfileNav } from "@/components/profile/ProfileNav";
import { useTranslation } from "react-i18next";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <RequireAuth>
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:pt-10">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] sm:text-3xl">{t("tabs.profile")}</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3 shadow-sm">
            <ProfileNav />
          </aside>
          <main className="min-w-0 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 shadow-sm sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}

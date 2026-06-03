"use client";

import { useQuery } from "@tanstack/react-query";
import { legalService } from "@/services/apiService/legal";
import { useTranslation } from "react-i18next";

export default function ProfilePrivacyPage() {
  const { t } = useTranslation();
  const privacyQuery = useQuery({
    queryKey: ["profile", "legal", "privacy"],
    queryFn: () => legalService.getPrivacyPolicy(),
  });

  if (privacyQuery.isLoading) return <div className="h-60 animate-pulse rounded-2xl bg-bg-input" />;

  const doc = privacyQuery.data;
  return (
    <div>
      <div className="mb-5">
        <div className="text-lg font-bold text-text-primary">{t("profile.menu.privacy")}</div>
        {doc?.updatedAt ? (
          <div className="mt-1 text-sm text-text-secondary">
            {t("terms.last_updated", { 
              date: new Date(doc.updatedAt).toLocaleString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }) 
            })}
          </div>
        ) : null}
      </div>
      <div className="rounded-3xl border border-border bg-page-bg-from p-5">
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: doc?.html ?? "<p>No privacy policy available.</p>" }}
        />
      </div>
    </div>
  );
}

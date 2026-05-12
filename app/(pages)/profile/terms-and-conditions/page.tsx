"use client";

import { useQuery } from "@tanstack/react-query";
import { legalService } from "@/services/apiService/legal";
import { useTranslation } from "react-i18next";

export default function ProfileTermsPage() {
  const { t } = useTranslation();
  const termsQuery = useQuery({
    queryKey: ["profile", "legal", "terms"],
    queryFn: () => legalService.getTermsAndConditions(),
  });

  if (termsQuery.isLoading) return <div className="h-60 animate-pulse rounded-2xl bg-bg-input" />;

  const doc = termsQuery.data;
  return (
    <div>
      <div className="mb-5">
        <div className="text-lg font-bold text-text-primary">{t("profile.menu.terms")}</div>
        {doc?.updatedAt ? (
          <div className="mt-1 text-sm text-text-secondary">{t("terms.last_updated", { date: doc.updatedAt })}</div>
        ) : null}
      </div>
      <div className="rounded-3xl border border-border bg-page-bg-from p-5">
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: doc?.html ?? "<p>No terms available.</p>" }}
        />
      </div>
    </div>
  );
}

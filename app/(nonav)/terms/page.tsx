"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { legalService } from "@/services/apiService/legal";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const {
    data: doc,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["legal", "terms"],
    queryFn: () => legalService.getTermsAndConditions(),
  });

  return (
    <main className="min-h-screen px-4 pb-20 pt-8">
      <div className="mx-2 sm:mx-20">
        <button
          onClick={() => router.back()}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back", "Back")}
        </button>

        <div className="overflow-hidden border border-border bg-bg-card/40 shadow-xl">
          <div className="border-b border-border bg-secondary-50/50 dark:bg-secondary-900/20 px-8 py-8 sm:px-10">
            <h1 className="text-3xl font-black text-text-primary tracking-tight sm:text-4xl">
              {t("common.terms")}
            </h1>
            {doc?.updatedAt && (
              <p className="mt-2 text-xs font-medium text-text-tertiary uppercase tracking-widest">
                {t("terms.last_updated", { date: new Date(doc.updatedAt).toLocaleDateString() })}
              </p>
            )}
          </div>

          <div className="p-8 sm:p-10">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
                <p className="mt-4 text-sm font-medium text-text-secondary">
                  {t("terms.loading")}
                </p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-900/20 mb-6">
                  <RefreshCw className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-text-primary">
                  {t("terms.load_failed")}
                </h2>
                <Button 
                  onClick={() => refetch()} 
                  variant="outline" 
                  className="mt-6 rounded-2xl"
                >
                  {t("terms.retry")}
                </Button>
              </div>
            ) : (
              <article 
                className="prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-headings:text-text-primary prose-p:text-text-secondary prose-li:text-text-secondary prose-strong:text-text-primary"
                dangerouslySetInnerHTML={{ __html: doc?.html ?? "" }}
              />
            )}
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-[0.2em] opacity-50">
            {t("terms.legal")}
          </p>
        </div>
      </div>
    </main>
  );
}

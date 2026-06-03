"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { legalService } from "@/services/apiService/legal";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const {
    data: doc,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["legal", "privacy"],
    queryFn: () => legalService.getPrivacyPolicy(),
  });

  return (
    <main className="min-h-screen px-4 pb-20 pt-8 bg-bg-page">
      <div className="mx-auto max-w-4xl sm:px-6">
        <button
          onClick={() => router.back()}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back", "Back")}
        </button>

        <div className="overflow-hidden rounded-[32px] border border-border bg-bg-card/40 shadow-xl backdrop-blur-md">
          <div className="border-b border-border bg-linear-to-br from-primary-500/10 via-primary-500/5 to-transparent px-8 py-10 sm:px-12">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
               <ShieldCheck className="size-8" />
            </div>
            <h1 className="text-3xl font-black text-text-primary tracking-tight sm:text-4xl">
              {t("common.privacy", "Privacy Policy")}
            </h1>
            {doc?.updatedAt && (
              <p className="mt-3 text-xs font-bold text-text-tertiary uppercase tracking-widest opacity-70">
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
              </p>
            )}
          </div>

          <div className="p-8 sm:p-12">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
                <p className="mt-4 text-sm font-medium text-text-secondary animate-pulse">
                  Loading policy details...
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
                  className="mt-6 rounded-2xl h-11 px-8"
                >
                  {t("terms.retry")}
                </Button>
              </div>
            ) : (
              <article 
                className="prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-headings:text-text-primary prose-p:text-text-secondary prose-li:text-text-secondary prose-strong:text-text-primary leading-relaxed"
                dangerouslySetInnerHTML={{ __html: doc?.html ?? "" }}
              />
            )}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.3em] opacity-40">
            Nhyvas Trust & Safety
          </p>
        </div>
      </div>
    </main>
  );
}

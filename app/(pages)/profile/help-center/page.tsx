"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, MessageCircle, MessageSquareText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { legalService } from "@/services/apiService/legal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ProfileHelpCenterPage() {
  const { t } = useTranslation();
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const faqsQuery = useQuery({
    queryKey: ["profile", "help", "faqs"],
    queryFn: () => legalService.getHelpFaqs(),
  });

  const supportQuery = useQuery({
    queryKey: ["profile", "help", "support-settings"],
    queryFn: () => legalService.getSupportSettings(),
  });

  const faqs = faqsQuery.data ?? [];
  const whatsappUrl = supportQuery.data?.whatsappUrl ?? null;

  const openWhatsApp = () => {
    if (!whatsappUrl || typeof window === "undefined") return;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  if (faqsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-14 animate-pulse rounded-2xl bg-bg-input" />
        <div className="h-40 animate-pulse rounded-3xl bg-bg-input" />
        <div className="h-24 animate-pulse rounded-3xl bg-bg-input" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <h2 className="text-xl font-extrabold text-text-primary sm:text-[22px]">{t("help_center.title")}</h2>
        <Link href="/profile/support-chats">
          <Button size="icon" className="h-11 w-11 rounded-full" aria-label={t("navigation.support_chats")}>
            <MessageCircle className="h-5 w-5 text-white" />
          </Button>
        </Link>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-bold text-text-primary">{t("help_center.faq")}</h3>
        {faqs.length === 0 ? (
          <div className="rounded-2xl border border-border bg-bg-input p-4 text-sm text-text-secondary">
            {t("help_center.empty_faq")}
          </div>
        ) : (
          <div className="space-y-2.5">
            {faqs
              .slice()
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="overflow-hidden rounded-2xl border border-border bg-bg-input transition hover:border-primary-200/60"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      aria-expanded={isOpen}
                    >
                      <span className="flex-1 pr-2 font-semibold text-text-primary">{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-text-tertiary" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-text-tertiary" />
                      )}
                    </button>
                    {isOpen ? (
                      <div className="border-t border-border px-4 py-4">
                        <div
                          className="prose prose-sm max-w-none text-text-secondary dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: faq.answer_html }}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-bg-input p-4 sm:p-5">
        <h3 className="font-bold text-text-primary">{t("help_center.support_title")}</h3>
        <p className="mt-2 text-sm text-text-secondary">{t("help_center.support_hint")}</p>
        <Button asChild className="mt-4 w-full sm:w-auto">
          <Link href="/profile/support-chats" className="inline-flex items-center gap-2">
            <MessageSquareText className="h-4 w-4" />
            {t("help_center.open_support_chat")}
          </Link>
        </Button>

        {whatsappUrl ? (
          <Button
            type="button"
            variant="outline"
            className={cn(
              "mt-3 w-full border-emerald-600 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/15 dark:text-emerald-300 sm:w-auto"
            )}
            onClick={openWhatsApp}
          >
            {t("help_center.whatsapp_support")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

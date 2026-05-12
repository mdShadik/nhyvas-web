"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { legalService } from "@/services/apiService/legal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordian";
import { useTranslation } from "react-i18next";

export default function ProfileHelpCenterPage() {
  const { t } = useTranslation();
  const faqsQuery = useQuery({
    queryKey: ["profile", "help", "faqs"],
    queryFn: () => legalService.getHelpFaqs(),
  });

  const supportQuery = useQuery({
    queryKey: ["profile", "help", "support-settings"],
    queryFn: () => legalService.getSupportSettings(),
  });

  if (faqsQuery.isLoading) return <div className="h-60 animate-pulse rounded-2xl bg-[var(--color-bg-input)]" />;

  const faqs = faqsQuery.data ?? [];
  const whatsappUrl = supportQuery.data?.whatsappUrl ?? null;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-bold text-text-primary">{t("help_center.title")}</div>
        <div className="mt-1 text-sm text-text-secondary">{t("help_center.faq")}</div>
      </div>

      {whatsappUrl ? (
        <div className="rounded-3xl border border-border bg-page-bg-from p-4">
          <div className="text-sm font-semibold text-text-primary">{t("help_center.support_title")}</div>
          <div className="mt-1 text-sm text-text-secondary">{t("help_center.whatsapp_support")}</div>
          <div className="mt-3">
            <Link
              href={whatsappUrl}
              target="_blank"
              className="inline-flex items-center rounded-full bg-primary-400 px-4 py-2 text-sm font-semibold text-white"
            >
              {t("help_center.whatsapp_support")}
            </Link>
          </div>
        </div>
      ) : null}

      {faqs.length === 0 ? (
        <div className="rounded-3xl border border-border bg-page-bg-from p-6 text-center">
          <div className="text-base font-bold text-text-primary">{t("help_center.empty_faq")}</div>
        </div>
      ) : (
        <Accordion type="single" defaultValue={[String(faqs[0]?.id ?? "")]}>
          {faqs
            .slice()
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((faq) => (
              <AccordionItem key={faq.id} value={String(faq.id)}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: faq.answer_html }}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
        </Accordion>
      )}
    </div>
  );
}

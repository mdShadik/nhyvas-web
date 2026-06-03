import { requestJson } from "@/services/apiService/http";

export type TermsDocument = {
  html: string;
  updatedAt: string | null;
};

export type HelpFaq = {
  id: string;
  question: string;
  answer_html: string;
  sort_order: number;
};

export type SupportSettings = {
  whatsappUrl: string | null;
};

export const legalService = {
  async getTermsAndConditions(): Promise<TermsDocument> {
    return await requestJson<TermsDocument>("/api/legal/terms", { method: "POST" });
  },

  async getPrivacyPolicy(): Promise<TermsDocument> {
    return await requestJson<TermsDocument>("/api/legal/privacy", { method: "POST" });
  },

  async getHelpFaqs(): Promise<HelpFaq[]> {
    const { rows } = await requestJson<{ rows: HelpFaq[] }>("/api/legal/faqs", { method: "POST" });
    return rows ?? [];
  },

  async getSupportSettings(): Promise<SupportSettings> {
    const { whatsappUrl } = await requestJson<{ whatsappUrl: string | null }>("/api/legal/support-settings", {
      method: "POST",
    });
    return { whatsappUrl: whatsappUrl ?? null };
  },
};

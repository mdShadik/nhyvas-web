import { requestJson } from "@/services/apiService/http";

export type PaymentGateway = {
  title: string;
  qr_code_url: string;
};

export type InvoiceInfo = {
  id: string;
  invoice_no: string;
  amount: number;
  currency_code: string;
  status: "issued" | "cancelled";
  issued_at: string;
  metadata?: any;
};

export type ListingPayment = {
  id: string;
  transaction_id: string | null;
  remarks: string | null;
  screenshot_url: string;
  status: "pending" | "verified" | "rejected";
  created_at: string;
  listing?: {
    id: string;
    property_title: string;
    price: number;
    currency_code: string;
    approval_fee_amount: number | null;
  };
  invoice?: InvoiceInfo | InvoiceInfo[];
};

export type SubmitPaymentInput = {
  listingId: string;
  transactionId?: string;
  remarks?: string;
  screenshotUrl: string;
};

export const paymentService = {
  async getActiveGateway(): Promise<PaymentGateway | null> {
    const { gateway } = await requestJson<{ gateway: PaymentGateway | null }>(
      "/api/payment/gateways",
      {
        method: "POST",
      }
    );
    return gateway;
  },

  async submitPayment(input: SubmitPaymentInput): Promise<void> {
    await requestJson("/api/payment/submit", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async getPaymentHistory(): Promise<ListingPayment[]> {
    const { items } = await requestJson<{ items: ListingPayment[] }>(
      "/api/payment/history"
    );
    return items || [];
  },
};

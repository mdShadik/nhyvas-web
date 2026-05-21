import { requestJson } from "@/services/apiService/http";

export type PaymentGateway = {
  title: string;
  qr_code_url: string;
};

export type SubmitPaymentInput = {
  listingId: string;
  transactionId?: string;
  remarks?: string;
  screenshotUrl: string;
};

export const paymentService = {
  async getActiveGateway(): Promise<PaymentGateway | null> {
    const { row } = await requestJson<{ row: PaymentGateway | null }>("/api/payment/gateways", {
      method: "POST",
    });
    return row;
  },

  async submitPayment(input: SubmitPaymentInput): Promise<void> {
    await requestJson("/api/payment/submit", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};

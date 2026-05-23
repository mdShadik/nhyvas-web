"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { paymentService, type ListingPayment } from "@/services/apiService/payment";
import { Loader2, ReceiptText, ExternalLink, XCircle, CheckCircle, Clock, X, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PaymentHistoryPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [payments, setPayments] = useState<ListingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    paymentService.getPaymentHistory()
      .then(setPayments)
      .catch(err => console.error("Failed to load payments:", err))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(new Date(dateString));
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Mobile-only header */}
      <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-4 border-b border-border bg-bg-page/40 backdrop-blur md:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/profile"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg-card text-text-primary transition active:scale-[0.98]"
            aria-label={t("common.back", "Back")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="min-w-0">
            <div className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              {t("profile.menu.payment_history")}
            </div>
            <div className="text-[10px] leading-tight text-text-tertiary">
              Track your verification payments
            </div>
          </div>
        </div>
      </div>

      <header className="hidden md:block">
        <h1 className="text-2xl font-black text-text-primary tracking-tight">
          {t("profile.menu.payment_history")}
        </h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Track your listing verification payments and their statuses.
        </p>
      </header>

      <div className="px-4 md:px-0">
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-border rounded-3xl bg-bg-card">
            <div className="mb-6 rounded-full bg-secondary-100 p-6 dark:bg-secondary-800">
              <ReceiptText className="h-10 w-10 text-text-tertiary opacity-40" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">No payments found</h3>
            <p className="mt-2 text-sm text-text-tertiary max-w-[280px] mx-auto">
              When you pay for listing verification, your history will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {payments.map((payment) => (
              <PaymentCard 
                key={payment.id} 
                payment={payment} 
                formatDate={formatDate} 
                onViewProof={setLightboxUrl}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="size-6" />
          </button>
          <div className="relative max-h-full max-w-5xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="Payment Proof"
              className="max-h-[90vh] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentCard({ 
  payment, 
  formatDate,
  onViewProof
}: { 
  payment: ListingPayment; 
  formatDate: (d: string) => string;
  onViewProof: (url: string) => void;
}) {
  const statusIcons = {
    pending: <Clock className="h-4 w-4" />,
    verified: <CheckCircle className="h-4 w-4" />,
    rejected: <XCircle className="h-4 w-4" />,
  };

  const statusColors = {
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/5",
    verified: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400 dark:bg-green-500/5",
    rejected: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400 dark:bg-red-500/5",
  };

  return (
    <div className="overflow-hidden border border-border rounded-3xl bg-bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col p-5 sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary-100 dark:bg-secondary-800">
            <ReceiptText className="h-7 w-7 text-text-secondary" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-lg text-text-primary truncate">
              {payment.listing?.property_title || "Listing Verification Fee"}
            </h4>
            <p className="font-mono text-[10px] text-text-tertiary">ID: {payment.listing?.id || "N/A"}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-tertiary font-medium">
              <span>{formatDate(payment.created_at)}</span>
              {payment.transaction_id && (
                <>
                  <span className="opacity-30">•</span>
                  <span className="font-mono bg-bg-input px-1.5 py-0.5 rounded border border-border/50">
                    TX: {payment.transaction_id}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between sm:mt-0 sm:flex-col sm:items-end sm:gap-2">
          <div className="text-xl font-black text-text-primary">
            {payment.listing?.approval_fee_amount || 0} {payment.listing?.currency_code || "NPR"}
          </div>
          <div className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest",
            statusColors[payment.status]
          )}>
            {statusIcons[payment.status]}
            {payment.status}
          </div>
        </div>
      </div>
      
      {payment.remarks && (
        <div className="border-t border-border/40 bg-secondary-50/20 px-5 py-4 dark:bg-secondary-900/10">
          <p className="text-[13px] italic text-text-tertiary leading-relaxed">
            &quot;{payment.remarks}&quot;
          </p>
        </div>
      )}
      
      <div className="border-t border-border/40 px-5 py-3 flex items-center justify-between">
        <button 
          onClick={() => onViewProof(payment.screenshot_url)}
          className="inline-flex items-center gap-2 text-xs font-bold text-primary-500 hover:text-primary-600 active:scale-95 transition-all group"
        >
          View Payment Proof
          <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

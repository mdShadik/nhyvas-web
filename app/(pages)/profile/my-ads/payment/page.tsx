"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { 
  ArrowLeft, 
  Loader2, 
  UploadCloud, 
  CheckCircle2, 
  X,
  CreditCard
} from "lucide-react";
import Image from "next/image";

import { paymentService, exploreService } from "@/services/apiService";
import { uploadToR2 } from "@/services/apiService/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { noImagePlaceholder } from "@/assets";

export interface SearchParamsProps {
  listingId?: string;
}

interface PageProps {
  searchParams: Promise<SearchParamsProps>;
}

export default function PaymentPage({ searchParams: searchParamsPromise }: PageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [listingId, setListingId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    searchParamsPromise.then(params => {
      setListingId(params.listingId?.trim() ?? "");
    });
  }, [searchParamsPromise]);

  const gatewayQuery = useQuery({
    queryKey: ["payment-gateway"],
    queryFn: () => paymentService.getActiveGateway(),
  });

  const listingQuery = useQuery({
    queryKey: ["listing-details", listingId],
    queryFn: () => exploreService.getListingDetails(listingId),
    enabled: Boolean(listingId),
  });

  const gateway = gatewayQuery.data;
  const listing = listingQuery.data?.listing;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast({ variant: "error", message: "Image must be smaller than 5MB" });
        return;
      }
      setScreenshotFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingId) return;
    if (!screenshotFile) {
      showToast({ variant: "error", message: "Please upload a payment screenshot" });
      return;
    }

    setSubmitting(true);
    try {
      const { publicUrl } = await uploadToR2({
        file: screenshotFile,
        folder: `payment/ss`,
      });

      await paymentService.submitPayment({
        listingId,
        transactionId: transactionId.trim(),
        remarks: remarks.trim(),
        screenshotUrl: publicUrl,
      });

      showToast({
        variant: "success",
        message: "Payment submitted for verification. Your listing status is now 'Payment Verification'.",
      });
      router.replace("/profile/my-ads");
    } catch (error: any) {
      showToast({ variant: "error", message: error.message || "Failed to submit payment" });
    } finally {
      setSubmitting(false);
    }
  };

  if (gatewayQuery.isLoading || (listingId && listingQuery.isLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!gateway) {
    return (
      <div className="py-8">
        <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-bg-card p-8 shadow-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary-100 text-text-tertiary mb-6">
            <X className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">{t("payment.unavailable_title")}</h1>
          <p className="mt-2 text-sm text-text-secondary">
            {t("payment.unavailable_desc")}
          </p>
          <Button onClick={() => router.back()} variant="outline" className="mt-6 rounded-2xl">
            {t("common.back")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col bg-bg-page">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 shrink-0 border-b border-border bg-bg-page/40 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg-card text-text-primary transition active:scale-[0.98]"
            aria-label={t("common.back", "Back")}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <div className="text-sm font-semibold text-text-primary">
              {t("payment.complete_payment")}
            </div>
            <div className="text-xs text-text-tertiary">
              {t("payment.listing_fee_subtitle")}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-6">
        <div className="mx-auto max-w-2xl space-y-8 pb-12">
          {/* Listing Summary */}
          {listing && (
            <div className="flex items-center gap-3 rounded-2xl bg-secondary-50 dark:bg-secondary-900/30 p-4 border border-border">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={listing.thumbnail_url || noImagePlaceholder}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-bold text-text-primary">{listing.property_title}</h2>
                <p className="mt-0.5 truncate text-xs text-text-tertiary">{listing.location_text}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{t("payment.amount_due")}</p>
                <p className="text-lg font-black text-primary-500">
                  {listing.approval_fee_amount != null 
                    ? `${listing.currency_code} ${listing.approval_fee_amount}`
                    : "Pending"}
                </p>
              </div>
            </div>
          )}

          {/* QR Code Section */}
          <div className="flex flex-col items-center text-center space-y-6 py-2">
            <div>
              <h3 className="text-lg font-bold text-text-primary">{gateway.title}</h3>
              <p className="mt-1 text-sm text-text-secondary max-w-xs mx-auto">
                {t("payment.qr_instructions")}
              </p>
            </div>

            <div className="relative p-6 rounded-[28px] border-4 border-primary-500/10 bg-white shadow-2xl">
              <div className="relative aspect-square w-48 sm:w-64">
                <Image
                  src={gateway.qr_code_url}
                  alt="Payment QR Code"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-100 dark:bg-secondary-800 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              {t("payment.verified_gateway")}
            </div>
          </div>

          <div className="h-px bg-border w-full" />
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">{t("payment.details_title")}</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="transaction-id" className="ml-1 text-xs text-text-secondary">{t("payment.transaction_id")}</Label>
                <Input
                  id="transaction-id"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. 8XJ92L0P"
                  className="h-12 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remarks" className="ml-1 text-xs text-text-secondary">{t("payment.remarks_optional")}</Label>
                <Input
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Payment for flat listing"
                  className="h-12 rounded-2xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="ml-1 text-xs text-text-secondary">{t("payment.screenshot_label")}</Label>
              <div className="flex flex-col gap-4">
                <label
                  htmlFor="screenshot-upload"
                  className={cn(
                    "group relative flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed transition-all",
                    previewUrl 
                      ? "border-emerald-500/30 bg-emerald-500/5" 
                      : "border-border bg-bg-input hover:border-primary-500/50 hover:bg-primary-500/5"
                  )}
                >
                  {previewUrl ? (
                    <div className="relative h-full w-full p-3">
                      <Image
                        src={previewUrl}
                        alt="Screenshot Preview"
                        fill
                        className="object-contain"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setScreenshotFile(null);
                          setPreviewUrl(null);
                        }}
                        className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 backdrop-blur-md"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                        <UploadCloud className="h-7 w-7" />
                      </div>
                      <div className="text-center px-4">
                        <span className="block text-sm font-bold text-text-primary">{t("payment.upload_hint")}</span>
                        <span className="mt-1 block text-xs text-text-tertiary">{t("payment.upload_constraints")}</span>
                      </div>
                    </>
                  )}
                  <input
                    id="screenshot-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={submitting}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="shrink-0 border-t border-border bg-bg-page/95 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
        <div className="mx-auto max-w-2xl">
          <Button
            type="submit"
            disabled={submitting || !screenshotFile}
            className="w-full h-14 rounded-2xl bg-linear-to-r from-primary-500 via-primary-600 to-tertiary-500 text-lg font-black text-white shadow-xl shadow-primary-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                {t("payment.submitting_button")}
              </>
            ) : (
              t("payment.submit_button")
            )}
          </Button>
          <p className="mt-3 text-center text-[10px] font-medium text-text-tertiary leading-relaxed px-4">
            {t("payment.disclaimer")}
          </p>
        </div>
      </div>
    </form>
  );
}

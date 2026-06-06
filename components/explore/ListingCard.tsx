"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Heart, ArrowRight, Eye, ChevronDown, Share2, CreditCard } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";
import { logoSingleN, noImagePlaceholder } from "@/assets";
import { useTranslation } from "react-i18next";
import { tPropertyCategory, tPropertySubcategory } from "@/i18n/masterData";
import { cn } from "@/lib/utils";
import { ExploreListing } from "@/services/apiService/explore";
import { useToast } from "@/context/ToastContext";

export type ListingCardVariant = "default" | "compact";

interface ListingCardProps {
  listing: ExploreListing;
  variant?: ListingCardVariant;
  action?: React.ReactNode;
  className?: string;
  onFavoriteClick?: (e: React.MouseEvent) => void;
  isFavorite?: boolean;
  isOwnAd?: boolean;
  onToggleRented?: (listingId: string, isRented: boolean) => void;
  initiallyExpandedNote?: boolean;
}

export function ListingCard({
  listing,
  variant = "default",
  action,
  className,
  onFavoriteClick,
  isFavorite = false,
  isOwnAd = false,
  onToggleRented,
  initiallyExpandedNote = false,
}: ListingCardProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isNoteExpanded, setIsNoteExpanded] = React.useState(initiallyExpandedNote);
  const [prevInitial, setPrevInitial] = React.useState(initiallyExpandedNote);

  if (initiallyExpandedNote !== prevInitial) {
    setIsNoteExpanded(initiallyExpandedNote);
    setPrevInitial(initiallyExpandedNote);
  }

  const thumbnailUrl = listing.thumbnail_url || noImagePlaceholder;
  const isCompact = variant === "compact";
  const isPublished = listing.status === "approved" || listing.status === "published";
  const isAwaitingPayment = isOwnAd && listing.status === "awaiting_payment";

  const categoryDisplayName = listing.property_category_name || listing.property_category;
  const subcategoryDisplayName = listing.subcategory_name || listing.subcategory;

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = typeof window !== "undefined" ? `${window.location.origin}/property?id=${listing.id}` : "";
    if (!url) return;

    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast({ variant: "success", message: t("common.copied", "Copied to clipboard.") });
      }
    } catch {
      showToast({ variant: "error", message: t("common.share_failed", "Could not share.") });
    }
  };

  const paymentAmount = React.useMemo(() => {
    if (listing.approval_fee_amount == null) return null;
    return formatPrice(Number(listing.approval_fee_amount), listing.currency_code ?? "NPR");
  }, [listing.approval_fee_amount, listing.currency_code]);

  const moderatorNoteSection = isOwnAd && (listing.status === "rejected" || listing.status === "changes_requested") && listing.moderator_note && (
    <div className="mt-2 flex flex-col">
      <div 
        className="flex items-center gap-1 cursor-pointer group/note"
        onClick={(e) => { 
          e.preventDefault(); 
          e.stopPropagation(); 
          setIsNoteExpanded(!isNoteExpanded); 
        }}
      >
        <span className="text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors">
          {t("my_ads.reason", "reason")}
        </span>
        <ChevronDown className={cn("h-3 w-3 text-red-500 transition-transform duration-300", isNoteExpanded ? "rotate-180" : "")} />
      </div>
      
      <motion.div
        initial={false}
        animate={{ height: isNoteExpanded ? "auto" : 0, opacity: isNoteExpanded ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden w-full"
      >
        <div className="mt-1 whitespace-normal break-words text-[11px] font-medium leading-relaxed text-red-600 dark:text-red-400 bg-red-500/5 px-3 py-2 rounded-xl border border-red-500/10">
          {listing.moderator_note}
        </div>
      </motion.div>
    </div>
  );

  const cardContent = (
    <article
      className={cn(
        "group relative overflow-hidden border border-border bg-bg-page/50 shadow-sm transition-all duration-300 backdrop-blur-md hover:border-primary-500/40 hover:shadow-lg dark:shadow-none",
        isCompact ? "flex flex-col p-2.5 sm:flex-row gap-3" : "flex flex-col lg:flex-row lg:min-h-[160px]",
        className,
      )}
      style={{
        clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
      }}
    >
      {/* Image Section */}
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-secondary-900/10 dark:bg-secondary-500 scale-110",
          isCompact
            ? "h-40 w-full rounded-xl sm:h-auto sm:w-40"
            : "h-44 w-full lg:h-auto lg:w-[200px] 2xl:w-[240px]",
        )}
      >
        <Image
          alt={listing.property_title}
          src={thumbnailUrl}
          fill
          unoptimized
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, 240px"
        />

        <div className="pointer-events-none absolute left-3 top-3 opacity-20">
          <Image src={logoSingleN} alt="" width={24} height={24} />
        </div>

        {!isCompact && listing.is_featured && (
          <div className="absolute bottom-2 left-2 rounded-full bg-primary-600/90 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white backdrop-blur-md">
            {t("explore.featured")}
          </div>
        )}
      </div>

      {/* Details Container */}
      <div className="flex flex-1 flex-col min-w-0 p-3 sm:p-4">
        {/* Header: Categories & Action Icons */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-1 min-w-0">
            <span className="shrink-0 rounded bg-primary-500/10 border border-primary-500/15 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-400">
              {tPropertyCategory(categoryDisplayName)}
            </span>
            {subcategoryDisplayName && (
              <span className="shrink-0 rounded bg-tertiary-500/10 border border-tertiary-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-tertiary-700 dark:text-tertiary-400">
                {tPropertySubcategory(subcategoryDisplayName)}
              </span>
            )}
            {isOwnAd && listing.status && (
              <span className={cn(
                "shrink-0 rounded border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider",
                isPublished ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600" : "border-amber-500/20 bg-amber-500/5 text-amber-600"
              )}>
                {t(`my_ads.status.${listing.status}`, listing.status.replace("_", " "))}
              </span>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {!isOwnAd && (
              <button
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  if (onFavoriteClick) onFavoriteClick(e);
                }}
                className={cn(
                  "p-1.5 rounded-full transition-all active:scale-90",
                  isFavorite ? "text-primary-500 bg-red-500/10" : "text-text-tertiary hover:bg-secondary-100 dark:hover:bg-secondary-800"
                )}
              >
                <Heart className={cn("h-4 w-4", isFavorite ? "fill-current" : "")} />
              </button>
            )}
            <button
              onClick={handleShare}
              className="p-1.5 rounded-full text-text-tertiary hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-all active:scale-90"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Title & Price Section */}
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 text-sm sm:text-base font-bold leading-tight tracking-tight text-text-primary group-hover:text-primary-500 transition-colors">
              {listing.property_title}
            </h3>
            <div className="shrink-0 text-base sm:text-lg font-black text-primary-600 dark:text-primary-400">
              {formatPrice(listing.price, listing.currency_code)}
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
            <MapPin className="h-3 w-3 text-primary-500" />
            <span className="truncate">{listing.location_text}</span>
          </div>
        </div>

        {/* Footer: Stats & Actions */}
        <div className="mt-auto flex items-center justify-between gap-4 border-t border-border/40 pt-2.5">
          <div className="flex items-center gap-3">
            {listing.view_count !== undefined && (
              <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-text-tertiary opacity-70">
                <Eye className="h-3 w-3" />
                <span>{listing.view_count}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isAwaitingPayment && paymentAmount ? (
              <Link
                href={`/profile/my-ads/payment?listingId=${listing.id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-[10px] font-black text-white transition hover:bg-primary-700 active:scale-95 shadow-md shadow-primary-500/20"
              >
                <CreditCard className="h-3.5 w-3.5" />
                {t("property.actions.pay_amount", "Pay {{amount}}", { amount: paymentAmount })}
              </Link>
            ) : action ? (
              <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                {action}
              </div>
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary-100 text-text-tertiary group-hover:bg-primary-500 group-hover:text-white transition-colors">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        </div>

        {moderatorNoteSection}
      </div>
    </article>
  );

  return (
    <Link href={{ pathname: "/property", query: { id: listing.id } }} className="block outline-none">
      {cardContent}
    </Link>
  );
}

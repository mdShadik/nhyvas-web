"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { MapPin, Heart, ArrowRight, Eye, ChevronDown } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";
import { logoSingleN, noImagePlaceholder } from "@/assets";
import { useTranslation } from "react-i18next";
import { tPropertyCategory, tPropertySubcategory } from "@/i18n/masterData";
import { cn } from "@/lib/utils";
import { ExploreListing } from "@/services/apiService/explore";

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
  // Use initiallyExpandedNote directly for initial state, but allow tracking explicit toggles
  const [isNoteExpanded, setIsNoteExpanded] = React.useState(initiallyExpandedNote);
  // Add a key to force re-render/reset state if initiallyExpandedNote changes significantly (e.g. tab switch)
  const [prevInitial, setPrevInitial] = React.useState(initiallyExpandedNote);

  if (initiallyExpandedNote !== prevInitial) {
      setIsNoteExpanded(initiallyExpandedNote);
      setPrevInitial(initiallyExpandedNote);
  }

  const thumbnailUrl = listing.thumbnail_url || noImagePlaceholder;
  const isCompact = variant === "compact";
  const isPublished = listing.status === "approved" || listing.status === "published";
  const shouldShowEditButton = isOwnAd && !isPublished;
  const shouldShowRentedToggle = isOwnAd && isPublished;

  const categoryDisplayName = listing.property_category_name || listing.property_category;
  const subcategoryDisplayName = listing.subcategory_name || listing.subcategory;

  const moderatorNoteSection = isOwnAd && (listing.status === "rejected" || listing.status === "changes_requested") && listing.moderator_note && (
    <div className="mt-2 flex flex-col lg:items-end">
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
        <div className="mt-2 whitespace-normal break-words text-[11px] font-medium leading-relaxed text-red-600 dark:text-red-400 bg-red-500/5 px-3 py-2 rounded-xl border border-red-500/10 lg:text-right">
          {listing.moderator_note}
        </div>
      </motion.div>
    </div>
  );

  const cardContent = (
    <article
      className={cn(
        "group relative overflow-hidden border border-border bg-linear-to-br from-primary-50 via-primary-200/30 to-tertiary-100/30 dark:from-primary-900/20 dark:via-primary-900/20 dark:to-tertiary-800/20 shadow-sm transition-all duration-500 backdrop-blur-md hover:border-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/10 dark:shadow-none",
        isCompact ? "flex flex-col p-3 sm:flex-row" : "flex flex-col lg:flex-row lg:min-h-[260px]",
        className,
      )}
      style={{
        clipPath:
          "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))",
      }}
    >
      {/* Image Section */}
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-secondary-900/10",
          isCompact
            ? "h-44 w-full rounded-2xl sm:h-auto sm:min-h-[180px] sm:w-44 lg:w-52"
            : "h-56 w-full lg:h-auto lg:min-h-full lg:w-[300px] 2xl:w-[400px]",
        )}
        style={
          !isCompact
            ? {
                clipPath:
                  "polygon(0 0, 100% 0, 100% 100%, 18px 100%, 0 calc(100% - 18px))",
              }
            : {}
        }
      >
        <Image
          alt={listing.property_title}
          src={thumbnailUrl}
          fill
          unoptimized
          className="object-cover transition duration-700 group-hover:scale-105 bg-linear-to-br from-primary-500/20 via-primary-200/10 to-tertiary-500/20"
          sizes={isCompact ? "(max-width: 640px) 100vw, 208px" : "(max-width: 640px) 100vw, 400px"}
        />

        {/* Floating Watermark */}
        <div className="pointer-events-none absolute left-4 top-4 opacity-15 transition-opacity group-hover:opacity-30">
          <Image src={logoSingleN} alt="" width={32} height={32} />
        </div>

        {/* Featured Badge */}
        {!isCompact && listing.is_featured && (
          <div className="absolute bottom-4 left-4 overflow-hidden rounded-full bg-linear-to-r from-primary-600 via-primary-500 to-tertiary-500 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl backdrop-blur-md">
            <motion.div
              className="absolute inset-0"
              initial={{ x: "-150%" }}
              animate={{ x: "250%" }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "linear",
                repeatDelay: 0.5,
              }}
            >
              <div className="h-full w-12 rotate-25 bg-white/40 blur-lg" />
            </motion.div>
            <span className="relative z-10">{t("explore.featured")}</span>
          </div>
        )}

        {onFavoriteClick && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFavoriteClick(e);
            }}
            type="button"
            className={cn(
              "absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-xl transition-all hover:scale-110 hover:bg-black/40 active:scale-90",
              isFavorite ? "border-red-400/40 bg-red-500/60 text-white" : "",
            )}
          >
            <Heart
              className={cn("h-5 w-5 transition-transform", isFavorite ? "fill-current scale-110" : "group-active:scale-90")}
            />
          </button>
        )}
      </div>

      {/* Details Container - Flex row on wider screens */}
      <div
        className={cn(
          "flex min-w-0 flex-1",
          isCompact ? "flex-col" : "flex-col 2xl:flex-row",
        )}
      >
        {/* Main Info Section (Left/Center) */}
        <div
          className={cn(
            "flex flex-1 flex-col justify-between space-y-4",
            isCompact ? "p-4" : "p-5 sm:p-6 lg:p-8",
          )}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="shrink-0 rounded-lg bg-primary-500/10 border border-primary-500/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-400">
                {tPropertyCategory(categoryDisplayName)}
              </span>
              {subcategoryDisplayName && (
                <span className="shrink-0 rounded-lg bg-tertiary-500/10 border border-tertiary-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-tertiary-700 dark:text-tertiary-400">
                  {tPropertySubcategory(subcategoryDisplayName)}
                </span>
              )}
              {isOwnAd && listing.status && (
                <span
                  className={cn(
                    "shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
                    isPublished
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : listing.status.includes("pending") || listing.status.includes("payment")
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
                  )}
                >
                  {t(`my_ads.status.${listing.status}`, listing.status.replace("_", " "))}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <h3
                className={cn(
                  "line-clamp-2 font-black leading-tight tracking-tight text-text-primary transition-colors duration-300 group-hover:text-primary-500",
                  isCompact ? "text-lg sm:text-xl" : "text-xl lg:text-3xl",
                )}
              >
                {listing.property_title}
              </h3>

              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-800">
                  <MapPin className="h-3.5 w-3.5 text-primary-500" />
                </div>
                <span className="truncate font-medium">{listing.location_text}</span>
              </div>
            </div>
          </div>

          {!isCompact && listing.view_count !== undefined && (
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-text-tertiary opacity-70">
              <Eye className="h-4 w-4" />
              <span>{listing.view_count} {t("property.views", "views")}</span>
            </div>
          )}
        </div>

        {/* Side Section: Price & Action (Right side on desktop, footer on mobile) */}
        {!isCompact && (
          <div className="flex flex-col gap-4 border-t border-border/50 bg-secondary-50/30 p-5 dark:bg-secondary-900/10 sm:flex-row sm:items-center sm:justify-between 2xl:flex-col 2xl:items-end 2xl:justify-center 2xl:border-l 2xl:border-t-0 2xl:w-[280px] 2xl:p-8">
            <div className="flex flex-col 2xl:w-full 2xl:items-end">
              <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-text-tertiary">
                {t("explore.price_label")}
              </p>
              <div className="text-2xl font-black tracking-tighter text-primary-500 dark:text-primary-400 lg:text-3xl xl:text-4xl">
                {formatPrice(listing.price, listing.currency_code)}
              </div>
              <p className="mt-1 hidden text-[10px] font-medium text-text-tertiary 2xl:block">
                {t("explore.per_month")}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto 2xl:w-full">
              <div className="flex w-full gap-2">
                {!action && !shouldShowEditButton && !shouldShowRentedToggle && (
                  <div className="group/btn flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-br from-primary-500 via-primary-600 to-tertiary-500 px-4 py-3 lg:px-6 lg:py-4 text-sm font-black text-white shadow-xl shadow-primary-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 group-hover:shadow-primary-500/30">
                    {t("explore.view_details")}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </div>
                )}

                {(action || shouldShowEditButton) && !shouldShowRentedToggle && (
                  <div className="flex w-full items-center justify-start gap-2 2xl:justify-end" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    {action}
                  </div>
                )}

                {shouldShowRentedToggle && onToggleRented && (
                  <div className="flex flex-col gap-3 w-full" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    <div className="flex items-center justify-between rounded-2xl bg-secondary-900/10 dark:bg-white/5 border border-white/10 px-4 py-3 lg:px-6 lg:py-4 transition-all duration-300">
                      <span className={cn(
                        "text-sm font-bold tracking-tight",
                        listing.is_rented ? "text-amber-500" : "text-text-primary"
                      )}>
                        {listing.is_rented ? t("my_ads.currently_rented") : t("my_ads.mark_as_rented")}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={listing.is_rented}
                        onClick={() => onToggleRented(listing.id, !listing.is_rented)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                          listing.is_rented ? "bg-primary-500" : "bg-secondary-200 dark:bg-secondary-800"
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            listing.is_rented ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                    {listing.is_rented && (
                      <div className="flex items-start gap-2 rounded-xl bg-amber-500/5 border border-amber-500/10 p-3">
                        <div className="mt-0.5 shrink-0">
                          <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-[11px] leading-relaxed text-text-tertiary">
                          {t("my_ads.unrent_process_hint")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Moderator Note for Default Variant */}
              {moderatorNoteSection}
            </div>
          </div>
        )}
        
        {/* Compact variant footer */}
        {isCompact && (
          <div className="flex flex-col gap-3 border-t border-border/40 px-4 pb-4 pt-3">
             <div className="flex items-center justify-between">
               <div className="font-black text-xl text-primary-500 dark:text-primary-400">
                  {formatPrice(listing.price, listing.currency_code)}
               </div>
               {action && (
                 <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                   {action}
                 </div>
               )}
             </div>

             {shouldShowRentedToggle && onToggleRented && (
               <div className="flex flex-col gap-2 w-full pt-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  <div className="flex items-center justify-between rounded-xl bg-secondary-900/10 dark:bg-white/5 border border-white/10 px-4 py-3">
                    <span className={cn(
                      "text-xs font-bold tracking-tight",
                      listing.is_rented ? "text-amber-500" : "text-text-primary"
                    )}>
                      {listing.is_rented ? t("my_ads.currently_rented") : t("my_ads.mark_as_rented")}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={listing.is_rented}
                      onClick={() => onToggleRented(listing.id, !listing.is_rented)}
                      className={cn(
                        "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        listing.is_rented ? "bg-primary-500" : "bg-secondary-200 dark:bg-secondary-800"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          listing.is_rented ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                  {listing.is_rented && (
                    <div className="flex items-start gap-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10 p-2">
                      <div className="mt-0.5 shrink-0">
                        <svg className="h-3 w-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-[10px] leading-snug text-text-tertiary">
                        {t("my_ads.unrent_process_hint")}
                      </p>
                    </div>
                  )}
               </div>
             )}

             {/* Moderator Note for Compact Variant */}
             {moderatorNoteSection}
          </div>
        )}
      </div>
    </article>
  );

  return (
    <Link
      href={{ pathname: "/property", query: { id: listing.id } }}
      className="block outline-none"
    >
      {cardContent}
    </Link>
  );
}

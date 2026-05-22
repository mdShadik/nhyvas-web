"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { MapPin, Heart, ArrowRight, Eye } from "lucide-react";
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
}: ListingCardProps) {
  const { t } = useTranslation();
  const thumbnailUrl = listing.thumbnail_url || noImagePlaceholder;
  const isCompact = variant === "compact";
  const isPublished = listing.status === "approved" || listing.status === "published";
  const shouldShowEditButton = isOwnAd && !isPublished;
  const shouldShowRentedToggle = isOwnAd && isPublished;

  const categoryDisplayName = listing.property_category_name || listing.property_category;
  const subcategoryDisplayName = listing.subcategory_name || listing.subcategory;

  const cardContent = (
    <article
      className={cn(
        "group relative overflow-hidden border border-white/20 bg-white/5 shadow-sm transition-all duration-500 backdrop-blur-md hover:border-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/10 dark:shadow-none",
        isCompact ? "flex flex-col p-3 sm:flex-row" : "flex flex-col sm:flex-row sm:min-h-[260px]",
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
            : "h-56 w-full sm:h-auto sm:min-h-full sm:w-[300px] lg:w-[360px] xl:w-[400px]",
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
          isCompact ? "flex-col" : "flex-col lg:flex-row",
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
          <div className="flex flex-col gap-5 border-t border-border/50 bg-secondary-50/30 p-5 dark:bg-secondary-900/10 sm:flex-row sm:items-center sm:justify-between sm:p-6 lg:w-[280px] lg:flex-col lg:items-end lg:justify-center lg:border-l lg:border-t-0 lg:p-8">
            <div className="flex flex-col sm:min-w-0 lg:items-end">
              <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-text-tertiary">
                {t("explore.price_label")}
              </p>
              <div className="text-3xl font-black tracking-tighter text-primary-500 dark:text-primary-400 lg:text-4xl">
                {formatPrice(listing.price, listing.currency_code)}
              </div>
              <p className="mt-1 hidden text-[10px] font-medium text-text-tertiary md:block">
                {t("explore.per_month")}
              </p>
            </div>

            <div className="flex w-full gap-2 sm:w-auto lg:w-full">
              {!action && !shouldShowEditButton && !shouldShowRentedToggle && (
                <div className="group/btn flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-br from-primary-500 via-primary-600 to-tertiary-500 px-6 py-4 text-sm font-black text-white shadow-xl shadow-primary-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 group-hover:shadow-primary-500/30">
                  {t("explore.view_details")}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </div>
              )}

              {(action || shouldShowEditButton) && !shouldShowRentedToggle && (
                <div className="flex w-full items-center justify-start gap-2 sm:justify-end" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  {action}
                </div>
              )}

              {shouldShowRentedToggle && onToggleRented && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onToggleRented(listing.id, !listing.is_rented);
                  }}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-black text-white shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95",
                    listing.is_rented
                      ? "bg-linear-to-br from-green-500 to-emerald-600 shadow-green-500/20"
                      : "bg-linear-to-br from-primary-500 via-primary-600 to-tertiary-500 shadow-primary-500/20",
                  )}
                >
                  {listing.is_rented ? t("my_ads.marked_rented") : t("my_ads.mark_rented")}
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Compact variant footer */}
        {isCompact && (
          <div className="flex flex-col gap-3 border-t border-border/40 px-4 pb-4 pt-3 sm:flex-row sm:items-center sm:justify-between">
             <div className="font-black text-xl text-primary-500 dark:text-primary-400">
                {formatPrice(listing.price, listing.currency_code)}
             </div>
             {(action || shouldShowRentedToggle) && (
               <div className="flex w-full justify-start sm:w-auto sm:justify-end" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                 {shouldShowRentedToggle && onToggleRented ? (
                   <button
                     type="button"
                     onClick={(e) => {
                       e.stopPropagation();
                       e.preventDefault();
                       onToggleRented(listing.id, !listing.is_rented);
                     }}
                     className={cn(
                       "flex h-9 w-full items-center justify-center rounded-xl px-4 text-sm font-black text-white shadow-lg transition-all active:scale-95 sm:w-auto",
                       listing.is_rented
                         ? "bg-linear-to-br from-green-500 to-emerald-600 shadow-green-500/20"
                         : "bg-linear-to-br from-primary-500 via-primary-600 to-tertiary-500 shadow-primary-500/20",
                     )}
                   >
                     {listing.is_rented ? t("my_ads.marked_rented") : t("my_ads.mark_rented")}
                   </button>
                 ) : (
                   action
                 )}
               </div>
             )}
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

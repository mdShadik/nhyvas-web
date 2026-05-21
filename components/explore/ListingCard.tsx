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
        isCompact ? "p-3" : "flex flex-col md:flex-row",
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
            ? "h-32 w-full rounded-2xl sm:w-32"
            : "h-64 w-full md:h-auto md:w-[320px] lg:w-[380px] md:min-h-64",
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
          sizes={isCompact ? "132px" : "(max-width: 768px) 100vw, 380px"}
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
          isCompact ? "flex-col mt-3 sm:mt-0 sm:ml-5" : "flex-col md:flex-row",
        )}
      >
        {/* Main Info Section (Left/Center) */}
        <div className="flex-1 p-6 lg:p-8 flex flex-col justify-between space-y-4">
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
              <h3 className="line-clamp-2 text-xl font-black text-text-primary group-hover:text-primary-500 transition-colors duration-300 lg:text-3xl leading-tight tracking-tight">
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

          <div className="flex items-center gap-4">
            {!isCompact && listing.view_count !== undefined && (
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-text-tertiary opacity-70">
                <Eye className="h-4 w-4" />
                <span>{listing.view_count} {t("property.views", "views")}</span>
              </div>
            )}
            
            {/* Mobile-only Price (hidden on md+) */}
            <div className="md:hidden font-black text-2xl text-primary-500">
              {formatPrice(listing.price, listing.currency_code)}
            </div>
          </div>
        </div>

        {/* Side Section: Price & Action (Right side on desktop, stacked on mobile) */}
        {!isCompact && (
          <div className="md:w-[260px] lg:w-[300px] border-t md:border-t-0 md:border-l border-border/50 p-6 lg:p-8 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-6 bg-secondary-50/30 dark:bg-secondary-900/10">
            <div className="flex flex-col md:items-end">
              <p className="text-[11px] font-black uppercase tracking-widest text-text-tertiary mb-1">
                {t("explore.price_label")}
              </p>
              <div className="font-black tracking-tighter text-3xl lg:text-4xl text-primary-500 dark:text-primary-400">
                {formatPrice(listing.price, listing.currency_code)}
              </div>
              <p className="hidden md:block text-[10px] font-medium text-text-tertiary mt-1">
                Per Month
              </p>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              {!action && !shouldShowEditButton && !shouldShowRentedToggle && (
                <div className="group/btn flex items-center justify-center gap-2 w-full rounded-2xl bg-linear-to-br from-primary-500 via-primary-600 to-tertiary-500 px-6 py-4 text-sm font-black text-white shadow-xl shadow-primary-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 group-hover:shadow-primary-500/30">
                  {t("explore.view_details")}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </div>
              )}

              {(action || shouldShowEditButton) && !shouldShowRentedToggle && (
                <div className="flex items-center gap-2 w-full justify-end" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
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
                    "flex items-center justify-center gap-2 w-full rounded-2xl px-6 py-4 text-sm font-black text-white shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95",
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
        
        {/* Compact variant action placement */}
        {isCompact && (
          <div className="px-4 pb-4 flex justify-end items-center gap-4">
             <div className="font-black text-xl text-primary-500">
                {formatPrice(listing.price, listing.currency_code)}
             </div>
             <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
               {action}
             </div>
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

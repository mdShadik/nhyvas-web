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

  const categoryDisplayName = listing.property_category_name || (listing as any).property_category;
  const subcategoryDisplayName = listing.subcategory_name || (listing as any).subcategory;

  const cardContent = (
    <article
      className={cn(
        "group overflow-hidden  border border-white/20 bg-white/5 shadow-sm transition-all duration-300 backdrop-blur-sm hover:border-primary-500/30 hover:shadow-lg dark:shadow-none",
        isCompact ? "p-3" : "flex flex-col lg:flex-row",
        className,
      )}
      style={{
        clipPath:
          "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
      }}
    >
      {/* Image Section */}
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-white",
          isCompact
            ? "h-32 w-full rounded-2xl sm:w-32"
            : "h-56 w-full lg:h-auto lg:w-[320px] lg:min-h-60",
        )}
        style={
          !isCompact
            ? {
                clipPath:
                  "polygon(0 0, 100% 0, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
              }
            : {}
        }
      >
        <Image
          alt={listing.property_title}
          src={thumbnailUrl}
          fill
          className="object-cover transition duration-500 group-hover:scale-110 bg-linear-to-br  from-primary-500/50 via-primary-200 to-tertiary-500/50"
          sizes={isCompact ? "132px" : "(max-width: 768px) 100vw, 360px"}
        />

        {/* Watermark */}
        <div className="pointer-events-none absolute left-3 top-3 opacity-20 transition-opacity group-hover:opacity-40">
          <Image src={logoSingleN} alt="Watermark" width={28} height={28} />
        </div>

        {/* Badges */}
        {!isCompact && listing.is_featured && (
          <div className="absolute bottom-3 left-3 overflow-hidden rounded-full bg-linear-to-r from-primary-600/90 to-tertiary-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xl backdrop-blur-md">
            {/* Shimmer */}
            <motion.div
              className="absolute inset-0"
              initial={{ x: "-120%" }}
              animate={{ x: "220%" }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "linear",
                repeatDelay: 0.4,
              }}
            >
              <div className="h-full w-10 rotate-12 bg-white/30 blur-md" />
            </motion.div>

            {/* Content */}
            <span className="relative z-10 flex items-center gap-1">
              {t("explore.featured")}
            </span>
          </div>
        )}

        {onFavoriteClick && (
          <button
            onClick={onFavoriteClick}
            type="button"
            className={cn(
              "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95",
              isFavorite
                ? "bg-red-500/80 border-red-400/50"
                : "hover:bg-black/40",
            )}
          >
            <Heart
              className={cn("h-4.5 w-4.5", isFavorite && "fill-current")}
            />
          </button>
        )}
      </div>

      {/* Content Section */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col justify-between",
          isCompact ? "mt-3 sm:mt-0 sm:ml-4" : "p-5",
        )}
      >
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="shrink-0 rounded-md bg-primary-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-400 border border-primary-500/20">
                  {tPropertyCategory(categoryDisplayName)}
                </span>
                {subcategoryDisplayName && (
                  <span className="shrink-0 rounded-md bg-tertiary-100  dark:bg-tertiary-400/20 px-2 py-0.5 text-[10px] font-medium dark:text-tertiary-400 text-tertiary-700 border border-tertiary-900/10 uppercase">
                    {tPropertySubcategory(subcategoryDisplayName)}
                  </span>
                )}
                {isOwnAd && listing.status && (
                  <span
                    className={cn(
                      "shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      listing.status === "approved" || listing.status === "published"
                        ? "border-emerald-500/20 bg-emerald-500/20 text-emerald-500 dark:text-emerald-400"
                        : listing.status === "pending"
                          ? "border-amber-500/20 bg-amber-500/20 text-amber-500 dark:text-amber-400"
                          : "border-red-500/20 bg-red-500/20 text-red-500 dark:text-red-400",
                    )}
                  >
                    {t(`status.${listing.status}`, listing.status.replace("_", " "))}
                  </span>
                )}
              </div>
              <h3 className="line-clamp-1 text-base font-bold text-text-primary group-hover:text-primary-500 transition-colors sm:text-lg">
                {listing.property_title}
              </h3>

              <div className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary-500" />
                <span className="truncate">{listing.location_text}</span>
              </div>

              {listing.view_count !== undefined && (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-text-tertiary font-medium">
                  <Eye className="h-3 w-3" />
                  <span>{listing.view_count} {t("property.views", "views")}</span>
                </div>
              )}
            </div>

            {isCompact && !shouldShowRentedToggle && action}

            {isCompact && shouldShowRentedToggle && onToggleRented && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onToggleRented(listing.id, !listing.is_rented);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow transition-all",
                  listing.is_rented
                    ? "bg-linear-to-br from-green-500 to-emerald-500"
                    : "bg-linear-to-br from-primary-500 to-tertiary-500",
                )}
              >
                {listing.is_rented ? t("my_ads.marked_rented") : t("my_ads.mark_rented")}
              </button>
            )}
          </div>
        </div>

        <div
          className={cn(
            "flex items-end justify-between gap-4 pt-3",
            !isCompact && "mt-4 border-t border-border",
          )}
        >
          <div>
            {!isCompact && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-0.5">
                {t("explore.price_label")}
              </p>
            )}
            <div
              className={cn(
                "font-extrabold text-primary-400",
                isCompact ? "text-lg" : "text-2xl",
              )}
            >
              {formatPrice(listing.price, listing.currency_code)}
            </div>
          </div>

          {!isCompact && !action && !shouldShowEditButton && !shouldShowRentedToggle && (
            <div className="flex items-center gap-2 rounded-xl bg-linear-to-br from-primary-500 via-primary-500 to-tertiary-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all group-hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]">
              {t("explore.view_details")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          )}

          {!isCompact && action && !shouldShowEditButton && !shouldShowRentedToggle && (
            <div onClick={(e) => e.preventDefault()}>{action}</div>
          )}

          {!isCompact && shouldShowEditButton && (
            <div onClick={(e) => e.preventDefault()}>{action}</div>
          )}

          {!isCompact && shouldShowRentedToggle && onToggleRented && (
            <div onClick={(e) => e.preventDefault()}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onToggleRented(listing.id, !listing.is_rented);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow transition-all",
                  listing.is_rented
                    ? "bg-linear-to-br from-green-500 to-emerald-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)]"
                    : "bg-linear-to-br from-primary-500 via-primary-500 to-tertiary-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]",
                )}
              >
                {listing.is_rented ? t("my_ads.marked_rented") : t("my_ads.mark_rented")}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );

  return (
    <Link
      href={{ pathname: "/property", query: { id: listing.id } }}
      className="block"
    >
      {cardContent}
    </Link>
  );
}

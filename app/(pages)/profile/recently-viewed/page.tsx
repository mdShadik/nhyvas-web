"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { activityService } from "@/services/apiService/activity";
import { formatPrice } from "@/lib/formatPrice";
import { noImagePlaceholder } from "@/assets";
import { useTranslation } from "react-i18next";

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs)) return "";
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const minutes = Math.floor(diffSec / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

export default function ProfileRecentlyViewedPage() {
  const { t } = useTranslation();
  const recentlyQuery = useQuery({
    queryKey: ["profile", "recently-viewed"],
    queryFn: () => activityService.getRecentlyViewed(),
  });

  const rows = recentlyQuery.data ?? [];

  if (recentlyQuery.isLoading) return <div className="h-60 animate-pulse rounded-2xl bg-bg-input" />;

  return (
    <div>
      <div className="mb-5">
        <div className="text-lg font-bold text-text-primary">{t("profile.menu.recently_viewed")}</div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-border bg-page-bg-from p-6 text-center">
          <div className="text-base font-bold text-text-primary">{t("recently_viewed.empty_title")}</div>
          <div className="mt-1 text-sm text-text-secondary">{t("recently_viewed.empty_hint")}</div>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const item = row.listing;
            const viewedAt = new Date(row.viewed_at);
            const viewedLabel = Number.isNaN(viewedAt.getTime()) ? "" : formatRelativeTime(viewedAt);
            const thumbnailUrl = item.thumbnail_url || noImagePlaceholder;
            return (
              <article
                key={`${item.id}_${row.viewed_at}`}
                className="overflow-hidden rounded-3xl border border-border bg-page-bg-from shadow-sm"
              >
                <div className="grid gap-4 p-4 sm:grid-cols-[132px_1fr] sm:items-center sm:gap-5">
                  <Link href={{ pathname: "/property", query: { id: item.id } }} className="relative h-32 w-full overflow-hidden rounded-2xl bg-bg-input sm:w-32">
                    <Image src={thumbnailUrl} alt={item.property_title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 132px" />
                  </Link>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <Link href={{ pathname: "/property", query: { id: item.id } }} className="block min-w-0">
                        <div className="truncate text-base font-bold text-text-primary">{item.property_title}</div>
                      </Link>
                      {viewedLabel ? (
                        <span className="rounded-full bg-bg-input px-3 py-1 text-xs font-semibold text-text-secondary">
                          {viewedLabel}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                      <MapPin className="h-4 w-4 text-accent" />
                      <span className="truncate">{item.location_text}</span>
                    </div>
                    <div className="mt-3 text-lg font-extrabold text-accent">
                      {formatPrice(item.price, item.currency_code)}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

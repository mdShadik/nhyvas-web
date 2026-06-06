"use client";

import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { activityService, favouritesService } from "@/services/apiService";
import { useTranslation } from "react-i18next";
import { ListingCard } from "@/components/explore/ListingCard";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { LoginModal } from "@/components/auth/LoginModal";

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
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const isLoggedIn = isAuthenticated;
  const currentUserId = user?.id;

  const [dateFilter, setDateFilter] = useState<"all" | "today" | "7d" | "30d" | "range">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);

  const recentlyQuery = useQuery({
    queryKey: ["profile", "recently-viewed"],
    queryFn: () => activityService.getRecentlyViewed(),
  });

  const allRows = recentlyQuery.data ?? [];

  const shortlistIdsQuery = useQuery({
    queryKey: ["my-shortlist-ids", allRows.map(r => r.listing.id)],
    queryFn: () => favouritesService.getMyFavouriteListingIdsForListings(allRows.map(r => r.listing.id)),
    enabled: isLoggedIn && allRows.length > 0,
  });

  const shortlistedIds = shortlistIdsQuery.data ?? [];

  const toggleShortlistMutation = useMutation({
    mutationFn: async ({ listingId, isFavorite }: { listingId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        await favouritesService.removeFavourite(listingId);
      } else {
        await favouritesService.addFavourite(listingId);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData(["my-shortlist-ids", allRows.map(r => r.listing.id)], (old: string[] | undefined) => {
        if (!old) return old;
        if (variables.isFavorite) {
          return old.filter(id => id !== variables.listingId);
        } else {
          return [...old, variables.listingId];
        }
      });
      showToast({
        variant: "success",
        message: variables.isFavorite ? t("property.actions.removed_shortlist") : t("property.actions.added_shortlist"),
      });
    },
    onError: () => {
      showToast({ variant: "error", message: t("common.something_went_wrong") });
    },
  });

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[RecentlyViewedPage] Data:", allRows);
    }
  }, [allRows]);

  const filteredRows = useMemo(() => {
    if (dateFilter === "all") return allRows;
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return allRows.filter((row) => {
      const viewedAt = new Date(row.viewed_at);
      if (Number.isNaN(viewedAt.getTime())) return false;

      if (dateFilter === "today") {
        return viewedAt >= startOfToday;
      }
      if (dateFilter === "7d") {
        const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return viewedAt >= cutoff;
      }
      if (dateFilter === "30d") {
        const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return viewedAt >= cutoff;
      }
      if (dateFilter === "range") {
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start && viewedAt < start) return false;
        if (end) {
          const endOfDay = new Date(end);
          endOfDay.setHours(23, 59, 59, 999);
          if (viewedAt > endOfDay) return false;
        }
        return true;
      }
      return true;
    });
  }, [allRows, dateFilter, endDate, startDate]);

  if (recentlyQuery.isLoading) return <div className="h-60 animate-pulse rounded-2xl bg-bg-input" />;

  const filterOptions: Array<{ id: typeof dateFilter; label: string }> = [
    { id: "all", label: t("recently_viewed.filter_all", "All") },
    { id: "today", label: t("recently_viewed.filter_today", "Today") },
    { id: "7d", label: t("recently_viewed.filter_7d", "7 Days") },
    { id: "30d", label: t("recently_viewed.filter_30d", "30 Days") },
    { id: "range", label: t("recently_viewed.filter_range", "Custom Range") },
  ];

  return (
    <div className="space-y-6">
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        title={t("auth.login_required")}
        description={t("auth.login_required_desc")}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-bold text-text-primary">
          {t("profile.menu.recently_viewed")}
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setDateFilter(opt.id)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-bold transition-all active:scale-95",
                dateFilter === opt.id
                  ? "border-primary-500 bg-primary-500 text-white shadow-md"
                  : "border-border bg-bg-input text-text-secondary hover:bg-secondary-50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {dateFilter === "range" && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white/5 p-4 backdrop-blur-sm">
          <div className="flex flex-1 flex-col gap-1.5 min-w-[140px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary ml-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg-input px-3 py-2 text-sm text-text-primary outline-none focus:border-primary-500/50 transition-colors"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5 min-w-[140px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary ml-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg-input px-3 py-2 text-sm text-text-primary outline-none focus:border-primary-500/50 transition-colors"
            />
          </div>
        </div>
      )}

      {filteredRows.length === 0 ? (
        <div className="rounded-[32px] border border-border bg-white/5 p-12 text-center backdrop-blur-sm">
          <div className="text-base font-bold text-text-primary">
            {allRows.length === 0 
              ? t("recently_viewed.empty_title") 
              : t("recently_viewed.no_results", "No matches found")}
          </div>
          <div className="mt-2 text-sm text-text-secondary max-w-xs mx-auto">
            {allRows.length === 0 
              ? t("recently_viewed.empty_hint") 
              : t("recently_viewed.no_results_hint", "Try adjusting your filters or timeframe.")}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRows.map((row) => {
            const item = row.listing;
            const viewedAt = new Date(row.viewed_at);
            const viewedLabel = Number.isNaN(viewedAt.getTime()) ? "" : formatRelativeTime(viewedAt);
            return (
              <ListingCard
                key={`${item.id}_${row.viewed_at}`}
                listing={item}
                variant="compact"
                isOwnAd={item.listed_by === currentUserId}
                isFavorite={shortlistedIds.includes(item.id)}
                onFavoriteClick={() => {
                  if (!isLoggedIn) {
                    setLoginOpen(true);
                    return;
                  }
                  toggleShortlistMutation.mutate({
                    listingId: item.id,
                    isFavorite: shortlistedIds.includes(item.id),
                  });
                }}
                action={
                  viewedLabel ? (
                    <span className="shrink-0 rounded-full bg-primary-500/10 border border-primary-500/20 px-3 py-1 text-[10px] font-bold text-primary-600 dark:text-primary-400">
                      {viewedLabel}
                    </span>
                  ) : null
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

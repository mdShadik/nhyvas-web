"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { favouritesService, type SavedListing } from "@/services/apiService/favourites";
import { useTranslation } from "react-i18next";
import { useToast } from "@/context/ToastContext";
import { ListingCard } from "@/components/explore/ListingCard";

export default function ProfileSavedPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ["profile", "saved"] as const;

  const savedQuery = useQuery({
    queryKey,
    queryFn: () => favouritesService.getMySavedListings(200, 0),
  });

  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const removeMutation = useMutation({
    mutationFn: (listingId: string) => favouritesService.removeFavourite(listingId),
    onMutate: async (listingId) => {
      setBusyIds((prev) => new Set(prev).add(listingId));
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SavedListing[]>(queryKey) ?? [];
      queryClient.setQueryData<SavedListing[]>(queryKey, previous.filter((row) => row.id !== listingId));
      return { previous, listingId };
    },
    onError: (err: any, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
      showToast({ variant: "error", message: err?.message ?? t("saved.empty_hint") });
    },
    onSettled: (_data, _err, listingId) => {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
    },
  });

  const rows = savedQuery.data ?? [];
  const sorted = useMemo(() => rows.slice().sort((a, b) => (a.favourited_at < b.favourited_at ? 1 : -1)), [rows]);

  if (savedQuery.isLoading) return <div className="h-60 animate-pulse rounded-2xl bg-bg-input" />;

  return (
    <div>
      <div className="mb-5">
        <div className="text-lg font-bold text-text-primary">{t("saved.title")}</div>
        <div className="mt-1 text-sm text-text-secondary">{t("saved.subtitle")}</div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-3xl border border-border bg-bg-from p-6 text-center">
          <div className="text-base font-bold text-text-primary">{t("saved.empty_title")}</div>
          <div className="mt-1 text-sm text-text-secondary">{t("saved.empty_hint")}</div>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((item) => (
            <ListingCard
              key={item.id}
              listing={item}
              variant="compact"
              isFavorite={true}
              onFavoriteClick={(e) => {
                e.preventDefault();
                if (!busyIds.has(item.id)) {
                  removeMutation.mutate(item.id);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

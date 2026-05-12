"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HeartOff, MapPin } from "lucide-react";
import { favouritesService, type SavedListing } from "@/services/apiService/favourites";
import { formatPrice } from "@/lib/formatPrice";
import { noImagePlaceholder } from "@/assets";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "react-i18next";

function ListingCard({ item, onRemove, busy }: { item: SavedListing; onRemove: () => void; busy: boolean }) {
  const thumbnailUrl = item.thumbnail_url || noImagePlaceholder;
  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-page-bg-from shadow-sm">
      <div className="grid gap-4 p-4 sm:grid-cols-[132px_1fr_auto] sm:items-center sm:gap-5">
        <Link href={{ pathname: "/property", query: { id: item.id } }} className="relative h-32 w-full overflow-hidden rounded-2xl bg-bg-input sm:w-32">
          <Image src={thumbnailUrl} alt={item.property_title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 132px" />
        </Link>
        <div className="min-w-0">
          <Link href={{ pathname: "/property", query: { id: item.id } }} className="block">
            <div className="truncate text-base font-bold text-text-primary">{item.property_title}</div>
          </Link>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
            <MapPin className="h-4 w-4 text-accent" />
            <span className="truncate">{item.location_text}</span>
          </div>
          <div className="mt-3 text-lg font-extrabold text-accent">
            {formatPrice(item.price, item.currency_code)}
          </div>
        </div>
        <div className="flex sm:justify-end">
          <Button variant="outline" onClick={onRemove} disabled={busy} className="w-full sm:w-auto">
            <HeartOff className="mr-2 h-4 w-4" />
            {busy ? "Removing..." : "Remove"}
          </Button>
        </div>
      </div>
    </article>
  );
}

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

  if (savedQuery.isLoading) return <div className="h-60 animate-pulse rounded-2xl bg-[var(--color-bg-input)]" />;

  return (
    <div>
      <div className="mb-5">
        <div className="text-lg font-bold text-[var(--color-text-primary)]">{t("saved.title")}</div>
        <div className="mt-1 text-sm text-[var(--color-text-secondary)]">{t("saved.subtitle")}</div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-page-bg-from)] p-6 text-center">
          <div className="text-base font-bold text-[var(--color-text-primary)]">{t("saved.empty_title")}</div>
          <div className="mt-1 text-sm text-[var(--color-text-secondary)]">{t("saved.empty_hint")}</div>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((item) => (
            <ListingCard
              key={item.id}
              item={item}
              busy={busyIds.has(item.id)}
              onRemove={() => removeMutation.mutate(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, MapPin, Pencil } from "lucide-react";
import { manageService } from "@/services/apiService/manage";
import type { ExploreListing } from "@/services/apiService/explore";
import { formatPrice } from "@/lib/formatPrice";
import { noImagePlaceholder } from "@/assets";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cacheListings } from "@/stores/myAdsStore";

function AdCard({ item }: { item: ExploreListing }) {
  const thumbnailUrl = item.thumbnail_url || noImagePlaceholder;
  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-page-bg-from shadow-sm">
      <div className="grid gap-4 p-4 sm:grid-cols-[132px_1fr_auto] sm:items-center sm:gap-5">
        <Link href={{ pathname: "/property", query: { id: item.id } }} className="relative h-32 w-full overflow-hidden rounded-2xl bg-bg-input sm:w-32">
          <Image src={thumbnailUrl} alt={item.property_title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 132px" />
        </Link>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <Link href={{ pathname: "/property", query: { id: item.id } }} className="block min-w-0">
              <div className="truncate text-base font-bold text-text-primary">{item.property_title}</div>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                <MapPin className="h-4 w-4 text-accent" />
                <span className="truncate">{item.location_text}</span>
              </div>
            </Link>
          </div>
          <div className="mt-3 text-lg font-extrabold text-accent">
            {formatPrice(item.price, item.currency_code)}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Link href={{ pathname: "/add-property", query: { listingId: item.id } }}>
            <Button variant="outline" className="w-full sm:w-auto">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function ProfileMyAdsPage() {
  const { t } = useTranslation();
  const adsQuery = useQuery({
    queryKey: ["profile", "my-ads"],
    queryFn: () => manageService.getMyAds(),
  });

  const rows = adsQuery.data ?? [];
  useEffect(() => {
    if (rows.length > 0) cacheListings(rows);
  }, [rows]);

  if (adsQuery.isLoading) return <div className="h-60 animate-pulse rounded-2xl bg-bg-input" />;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-lg font-bold text-text-primary">{t("profile.menu.my_ads")}</div>
        </div>
        <Link href="/add-property">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("explore.list_property")}
          </Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-border bg-page-bg-from p-6 text-center">
          <div className="text-base font-bold text-text-primary">{t("my_ads.empty_title")}</div>
          <div className="mt-1 text-sm text-text-secondary">{t("my_ads.empty_hint_all")}</div>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((item) => (
            <AdCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

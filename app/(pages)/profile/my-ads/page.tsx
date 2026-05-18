"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil } from "lucide-react";
import { manageService } from "@/services/apiService/manage";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cacheListings } from "@/stores/myAdsStore";
import { ListingCard } from "@/components/explore/ListingCard";

export default function ProfileMyAdsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const adsQuery = useQuery({
    queryKey: ["profile", "my-ads"],
    queryFn: () => manageService.getMyAds(),
  });

  const rows = adsQuery.data ?? [];
  useEffect(() => {
    if (rows.length > 0) cacheListings(rows);
  }, [rows]);

  const handleToggleRented = async (listingId: string, isRented: boolean) => {
    await manageService.toggleIsRented(listingId, isRented);
    await queryClient.invalidateQueries({ queryKey: ["profile", "my-ads"] });
  };

  if (adsQuery.isLoading) return <div className="h-60 animate-pulse rounded-2xl bg-bg-input" />;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-lg font-bold text-text-primary">{t("profile.menu.my_ads")}</div>
        </div>
        <Link href="/add-property">
          <Button className="bg-linear-to-br from-primary-500 via-primary-500 to-tertiary-500">
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
            <ListingCard
              key={item.id}
              listing={item}
              variant="compact"
              isOwnAd
              onToggleRented={handleToggleRented}
              action={
                <Link href={{ pathname: "/add-property", query: { listingId: item.id } }}>
                  <Button variant="outline" size="sm" className="h-9 px-3">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

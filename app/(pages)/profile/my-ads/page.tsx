"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil } from "lucide-react";
import { manageService } from "@/services/apiService/manage";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cacheListings } from "@/stores/myAdsStore";
import { ListingCard } from "@/components/explore/ListingCard";
import { cn } from "@/lib/utils";

export default function ProfileMyAdsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  const adsQuery = useQuery({
    queryKey: ["profile", "my-ads"],
    queryFn: () => manageService.getMyAds(),
  });

  const rows = useMemo(() => adsQuery.data ?? [], [adsQuery.data]);

  const filteredRows = rows.filter((row) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "approved") {
      return row.status === "approved" || row.status === "published";
    }
    return row.status === statusFilter;
  });

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

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { id: "all", label: t("common.all", "All") },
          { id: "approved", label: t("my_ads.status.approved", "Approved") },
          { id: "pending_review", label: t("my_ads.status.pending_review", "Pending Review") },
          { id: "awaiting_payment", label: t("my_ads.status.awaiting_payment", "Awaiting Payment") },
          { id: "payment_verification", label: t("my_ads.status.payment_verification", "Payment Verification") },
          { id: "changes_requested", label: t("my_ads.status.changes_requested", "Request Change") },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              statusFilter === tab.id
                ? "bg-primary-500 text-white shadow-md"
                : "bg-bg-input text-text-secondary hover:bg-secondary-100 dark:hover:bg-secondary-800"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredRows.length === 0 ? (
        <div className="rounded-3xl border border-border bg-page-bg-from p-6 text-center">
          <div className="text-base font-bold text-text-primary">{t("my_ads.empty_title")}</div>
          <div className="mt-1 text-sm text-text-secondary">
            {statusFilter === "all" ? t("my_ads.empty_hint_all") : t("my_ads.no_ads_for_status", "No ads found for this status.")}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRows.map((item) => (
            <ListingCard
              key={item.id}
              listing={item}
              variant="compact"
              isOwnAd
              onToggleRented={handleToggleRented}
              action={
                item.status === "pending_review" || item.status === "changes_requested" ? (
                  <Link href={{ pathname: "/add-property", query: { listingId: item.id } }}>
                    <Button variant="outline" size="sm" className="h-9 px-3">
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                ) : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

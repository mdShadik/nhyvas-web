"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil } from "lucide-react";
import { manageService } from "@/services/apiService/manage";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cacheListings } from "@/stores/myAdsStore";
import { ListingCard } from "@/components/explore/ListingCard";
import { cn } from "@/lib/utils";

import { ListPropertyButton } from "@/components/common/ListPropertyButton";

export default function ProfileMyAdsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const statusScrollerRef = useRef<HTMLDivElement | null>(null);
  const statusDragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    scrollLeft: 0,
  });

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

  const handleStatusPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const scroller = statusScrollerRef.current;
    if (!scroller) return;

    statusDragRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      scrollLeft: scroller.scrollLeft,
    };
    scroller.setPointerCapture(event.pointerId);
  };

  const handleStatusPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = statusDragRef.current;
    const scroller = statusScrollerRef.current;
    if (!drag.active || !scroller) return;

    const deltaX = event.clientX - drag.startX;
    if (Math.abs(deltaX) > 4) drag.moved = true;
    if (!drag.moved) return;

    scroller.scrollLeft = drag.scrollLeft - deltaX;
    event.preventDefault();
  };

  const stopStatusDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const scroller = statusScrollerRef.current;
    if (scroller?.hasPointerCapture(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
    }
    statusDragRef.current.active = false;
  };

  if (adsQuery.isLoading) return <div className="h-60 animate-pulse rounded-2xl bg-bg-input" />;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black text-text-primary tracking-tight">{t("profile.menu.my_ads")}</h1>
          <p className="text-sm text-text-tertiary mt-1">{t("my_ads.manage_subtitle")}</p>
        </div>
        
        <ListPropertyButton className="group relative w-full sm:w-auto">
          <div className="absolute inset-0 bg-primary-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-linear-to-br from-primary-500 via-primary-600 to-tertiary-500 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-primary-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] sm:w-auto">
             {/* Shimmer Effect */}
             <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                <motion.div 
                  className="h-full w-12 rotate-25 bg-white/30 blur-lg"
                  animate={{ x: ["-200%", "500%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                />
             </div>
             
             <Plus className="h-4.5 w-4.5" strokeWidth={3} />
             <span className="relative z-10">{t("explore.list_property")}</span>
          </div>
        </ListPropertyButton>
      </div>

      <div className="mb-8 -mx-4 max-w-[100vw] overflow-hidden sm:mx-0 sm:max-w-full">
        <div
          ref={statusScrollerRef}
          onPointerDown={handleStatusPointerDown}
          onPointerMove={handleStatusPointerMove}
          onPointerUp={stopStatusDrag}
          onPointerCancel={stopStatusDrag}
          onClickCapture={(event) => {
            if (!statusDragRef.current.moved) return;
            event.preventDefault();
            event.stopPropagation();
            statusDragRef.current.moved = false;
          }}
          className="flex w-full min-w-0 cursor-grab touch-none select-none flex-nowrap gap-2 overflow-x-auto overscroll-x-contain px-4 pb-2 scrollbar-hide active:cursor-grabbing sm:px-0"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {[
            { id: "all", label: t("common.all", "All") },
            { id: "approved", label: t("my_ads.status.approved", "Approved") },
            { id: "pending_review", label: t("my_ads.status.pending_review", "Pending Review") },
            { id: "awaiting_payment", label: t("my_ads.status.awaiting_payment", "Awaiting Payment") },
            { id: "payment_verification", label: t("my_ads.status.payment_verification", "Payment Verification") },
            { id: "changes_requested", label: t("my_ads.status.changes_requested", "Request Change") },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "shrink-0 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300",
                  isActive
                    ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                    : "bg-bg-input text-text-tertiary border border-border hover:border-primary-500/30 hover:text-text-primary"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
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

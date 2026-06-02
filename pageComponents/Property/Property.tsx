"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CreditCard,
  Eye,
  Heart,
  Link as LinkIcon,
  Loader2,
  Map,
  MapPin,
  MessageCircle,
  Pencil,
  Share2,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { noImagePlaceholder } from "@/assets";
import {
  authApi,
  chatService,
  exploreService,
  favouritesService,
  leadsService,
  storiesService,
  activityService,
} from "@/services/apiService";
import { uploadToR2 } from "@/services/apiService/media";
import type { ExploreListing } from "@/services/apiService/explore";
import { formatPrice } from "@/lib/formatPrice";
import { tAmenity, tAmenityCategory, tCurrency, tPropertyCategory, tPropertySubcategory } from "@/i18n/masterData";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { LoginModal } from "@/components/auth/LoginModal";
import { useToast } from "@/context/ToastContext";
import { CoverageMap } from "@/components/map/CoverageMap";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { CameraCapture } from "@/components/ui/camera-capture";
import { SearchParamsProps } from "@/app/(pages)/property/page";
import { cn } from "@/lib/utils";
import { getVideoDuration, MAX_VIDEO_DURATION, MAX_VIDEO_SIZE, MAX_VIDEO_UPLOAD_SIZE } from "@/lib/video/videoUtils";

function getListingImages(listing: ExploreListing | null) {
  if (!listing) return [];
  const urls = (listing.photo_urls ?? [])
    .map((u) => (typeof u === "string" ? u.trim() : ""))
    .filter(Boolean);
  if (urls.length) return urls;
  if (listing.thumbnail_url) return [listing.thumbnail_url];
  return [noImagePlaceholder];
}

async function shareOrCopy(url: string) {
  try {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      await (navigator as any).share({ url });
      return "shared";
    }
  } catch {
    // fall back to copy
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}

interface Props {
  searchParams: SearchParamsProps;
}

export default function PropertyPage({searchParams}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = searchParams.id?.trim() || "";
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [desktopMapOpen, setDesktopMapOpen] = useState(false);

  const nextUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.pathname}${window.location.search}`;
  }, []);

  const requireAuth = (action: () => void) => {
    if (isAuthenticated) {
      action();
      return;
    }
    setLoginOpen(true);
  };

  const currentUserId = user?.id;

  const listingQuery = useQuery({
    queryKey: ["listing-details", id],
    queryFn: () => exploreService.getListingDetails(id),
    enabled: Boolean(id),
  });

  const listing = listingQuery.data?.listing ?? null;
  const isOwner = Boolean(currentUserId && listing?.listed_by && listing.listed_by === currentUserId);
  const listingStatus = (listing?.status ?? "").toLowerCase().trim();
  const isApprovedListing = listingStatus === "approved" || listingStatus === "published";
  const canEditListing = isOwner && (listingStatus === "pending_review" || listingStatus === "changes_requested");
  const canPayForListing = isOwner && listingStatus === "awaiting_payment";
  const canUsePublicActions = !isOwner && isApprovedListing;

  useEffect(() => {
    if (id && listing && !isOwner) {
      void activityService.recordPropertyView(id);
    }
  }, [id, listing, isOwner]);

  const hasMap = Boolean(listing?.latitude != null && listing?.longitude != null);
  const lat = listing?.latitude != null ? Number(listing.latitude) : NaN;
  const lng = listing?.longitude != null ? Number(listing.longitude) : NaN;
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lng);

  const favouriteIdsQuery = useQuery({
    queryKey: ["listing-details-favorite", id],
    queryFn: () => favouritesService.getMyFavouriteListingIdsForListings([id]),
    enabled: Boolean(id) && canUsePublicActions,
  });
  const isFavourite = (favouriteIdsQuery.data ?? []).includes(id);

  const myLeadQuery = useQuery({
    queryKey: ["listing-my-lead", id, currentUserId],
    queryFn: async () => {
      if (!id || !currentUserId) return [];
      const leads = await leadsService.getLeadsForListing(id);
      return leads.filter((lead) => lead.inquirer_id === currentUserId);
    },
    enabled: Boolean(id && currentUserId) && canUsePublicActions,
  });
  const hasInterested = (myLeadQuery.data ?? []).length > 0;

  const ownerLeadsQuery = useQuery({
    queryKey: ["owner-leads", id],
    queryFn: () => leadsService.getLeadsForListing(id ?? ""),
    enabled: Boolean(id && isOwner && isApprovedListing),
  });
  const ownerLeadCount = (ownerLeadsQuery.data ?? []).length;

  const toggleFavouriteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      if (isFavourite) {
        await favouritesService.removeFavourite(id);
      } else {
        await favouritesService.addFavourite(id);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["listing-details-favorite", id] });
      await queryClient.invalidateQueries({ queryKey: ["listings"] });
      showToast({
        variant: "success",
        message: isFavourite
          ? t("property.actions.removed_shortlist", "Removed from shortlist.")
          : t("property.actions.added_shortlist", "Saved to shortlist."),
        durationMs: 2800,
      });
    },
    onError: (err: any) => {
      showToast({
        variant: "error",
        message: err?.message ?? t("common.something_went_wrong", "Something went wrong."),
      });
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      await leadsService.createLead(id, null);
    },
    onSuccess: async () => {
      showToast({
        variant: "success",
        message: t("property.actions.interested_success", "Interest sent successfully."),
      });
      await queryClient.invalidateQueries({ queryKey: ["listing-my-lead", id, currentUserId] });
      await queryClient.invalidateQueries({ queryKey: ["my-leads"] });
    },
    onError: (err: any) => {
      showToast({
        variant: "error",
        message:
          err?.message ??
          t("property.actions.interested_failed", "Failed to send interest."),
      });
    },
  });

  const createChatRoomMutation = useMutation({
    mutationFn: async () => {
      if (!id || !currentUserId || !listing?.listed_by) {
        throw new Error("Missing data to start chat");
      }
      return await chatService.createRoom(id, listing.listed_by);
    },
    onSuccess: (roomId) => {
      if (!roomId) return;
      router.push(`/chat/${roomId}`);
    },
    onError: (err: any) => {
      showToast({
        variant: "error",
        message: err?.message ?? t("property.actions.chat_failed", "Failed to start chat."),
      });
    },
  });

  const images = useMemo(() => getListingImages(listing), [listing]);

  const amenityLabels = useMemo(() => {
    return (listing?.amenity_tags ?? [])
      .map((raw) => (typeof raw === "string" ? raw.trim() : ""))
      .filter(Boolean)
      .map((name) => tAmenity(name));
  }, [listing?.amenity_tags]);

  const enrichedAmenities = listingQuery.data?.enrichedAmenities ?? [];
  const groupedAmenities = useMemo(() => {
    const groups: Record<string, { category_name: string; category_code: string; amenities: typeof enrichedAmenities }> = {};
    for (const amenity of enrichedAmenities) {
      const key = amenity.category_id || "uncategorized";
      if (groups[key]) {
        groups[key].amenities.push(amenity);
      } else {
        groups[key] = { category_name: amenity.category_name || "Other", category_code: amenity.category_code || "", amenities: [amenity] };
      }
    }
    return Object.values(groups);
  }, [enrichedAmenities]);

  const description = (listing?.description ?? "").trim();
  const displayDescription = showFullDescription ? description : description.slice(0, 420);
  
  const paymentAmount = useMemo(() => {
    if (listing?.approval_fee_amount == null) return null;
    return formatPrice(Number(listing.approval_fee_amount), listing.currency_code ?? "NPR");
  }, [listing?.approval_fee_amount, listing?.currency_code]);

  const formattedStatus = listingStatus
    ? listingStatus
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "";

  const renderListingAction = (variant: "mobile" | "desktop") => {
    const fullWidth = variant === "mobile";

    // Debugging logs to help identify missing CTAs
    if (process.env.NODE_ENV === "development") {
      console.log("[PropertyPage] CTA Debug:", {
        id,
        listingStatus,
        isOwner,
        isApprovedListing,
        canEditListing,
        canPayForListing,
        canUsePublicActions,
        currentUserId
      });
    }

    const primaryClass = fullWidth
      ? "flex w-full items-center justify-center gap-2 bg-linear-to-br from-primary-500 via-primary-500 to-tertiary-500 py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] rounded-2xl"
      : "inline-flex items-center gap-2 bg-linear-to-br from-primary-500 via-primary-500 to-tertiary-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 rounded-2xl";
    const secondaryClass = fullWidth
      ? "flex flex-1 items-center justify-center gap-2 border border-border bg-bg-input py-3.5 text-sm font-semibold text-text-primary transition active:scale-[0.98] disabled:opacity-60 rounded-2xl"
      : "inline-flex items-center gap-2 border border-border bg-bg-input px-6 py-3 text-sm font-semibold text-text-primary shadow-sm transition hover:bg-secondary-100 disabled:opacity-60 dark:hover:bg-secondary-800 rounded-2xl";
    const chatClass = fullWidth
      ? "flex flex-1 items-center justify-center gap-2 bg-linear-to-br from-primary-500 via-primary-500 to-tertiary-500 py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60 rounded-2xl"
      : "inline-flex items-center gap-2 bg-linear-to-br from-primary-500 via-primary-500 to-tertiary-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60 rounded-2xl";

    if (canEditListing) {
      return (
        <Link href={`/add-property?listingId=${id}`} className={primaryClass}>
          <Pencil className="h-4 w-4" />
          {t("property.actions.edit_listing", "Edit Listing")}
        </Link>
      );
    }

    if (canPayForListing) {
      return (
        <Link href={`/profile/my-ads/payment?listingId=${id}`} className={primaryClass}>
          <CreditCard className="h-4 w-4" />
          {paymentAmount
            ? t("property.actions.pay_amount", "Pay {{amount}}", { amount: paymentAmount })
            : t("property.actions.pay", "Pay")}
        </Link>
      );
    }

    if (isOwner && isApprovedListing) {
      return (
        <Link href={`/profile/leads?listingId=${id}`} className={primaryClass}>
          <Users className="h-4 w-4" />
          {t("property.actions.my_interested", "My Interested")}
          {ownerLeadCount > 0 ? ` (${ownerLeadCount})` : ""}
        </Link>
      );
    }

    if (!isOwner && isApprovedListing) {
      return (
        <div className={fullWidth ? "flex items-center gap-3" : "flex flex-wrap gap-3"}>
          <button
            type="button"
            disabled={hasInterested || createLeadMutation.isPending}
            onClick={() => requireAuth(() => createLeadMutation.mutate())}
            className={secondaryClass}
          >
            {createLeadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LinkIcon className="h-4 w-4" />
            )}
            {hasInterested
              ? t("property.actions.interested_done", "Interest sent")
              : t("property.actions.interested", "I'm interested")}
          </button>
          <button
            type="button"
            disabled={createChatRoomMutation.isPending}
            onClick={() => requireAuth(() => createChatRoomMutation.mutate())}
            className={chatClass}
          >
            {createChatRoomMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
            {fullWidth ? t("property.actions.chat", "Chat") : t("property.actions.chat", "Chat with owner")}
          </button>
        </div>
      );
    }

    if (!listingStatus) return null;

    return (
      <div className={fullWidth ? "w-full rounded-2xl border border-border bg-bg-input px-4 py-3 text-center text-sm font-semibold text-text-secondary" : "rounded-2xl border border-border bg-bg-input px-4 py-3 text-sm font-semibold text-text-secondary"}>
        {t("property.actions.status_message", "Status: {{status}}", { status: formattedStatus })}
      </div>
    );
  };

  if (!id) {
    return (
      <main className={`min-h-screen`}>
        <div className="mx-auto w-full max-w-3xl px-4 py-10">
          <div className="rounded border border-border bg-bg-page p-6 text-text-secondary">
            {t("property.missing_id", "Missing property id.")}
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <LoginModal
        open={loginOpen}
        nextUrl={nextUrl}
        onClose={() => setLoginOpen(false)}
        title={t("auth.login_required", "Login required")}
        description={t("auth.login_required_desc", "Please sign in to continue with this action.")}
      />

      {/* ── MOBILE LAYOUT ── */}
      <div className="min-h-dvh md:hidden bg-bg-page">
        {/* Full-bleed hero */}
        <div className="sticky top-0 h-[50dvh] w-full overflow-hidden bg-secondary-100 dark:bg-secondary-800">
          <AnimatePresence initial={false}>
            <motion.div
              key={activeImageIndex}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.2 }}
              drag={images.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              onDragEnd={(_, info) => {
                if (images.length <= 1) return;
                const swipe = info.offset.x;
                if (swipe < -80) {
                  setActiveImageIndex((p) => Math.min(images.length - 1, p + 1));
                } else if (swipe > 80) {
                  setActiveImageIndex((p) => Math.max(0, p - 1));
                }
              }}
              className="absolute inset-0 bg-white"
            >
              <Image
                src={images[activeImageIndex] ?? noImagePlaceholder}
                alt=""
                fill
                priority
                unoptimized
                className="object-cover pointer-events-none bg-linear-to-br  from-primary-500/50 via-primary-200 to-tertiary-500/50"
                sizes="100vw"
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/50 via-black/15 to-black/70" />

          {/* Top bar */}
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-10 w-10 items-center justify-center bg-black/35 text-white backdrop-blur-lg transition hover:bg-black/55 rounded-full"
              aria-label={t("common.back", "Back")}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  requireAuth(async () => {
                    const url = typeof window !== "undefined" ? window.location.href : "";
                    if (!url) return;
                    const result = await shareOrCopy(url);
                    showToast({
                      variant: result === "failed" ? "error" : "success",
                      message:
                        result === "copied"
                          ? t("common.copied", "Copied to clipboard.")
                          : result === "shared"
                            ? t("common.shared", "Shared.")
                            : t("common.share_failed", "Could not share."),
                    });
                  })
                }
                className="inline-flex h-10 w-10 items-center justify-center bg-black/35  text-white backdrop-blur-lg transition hover:bg-black/55"
                aria-label={t("common.share", "Share")}
              >
                <Share2 className="h-4.5 w-4.5" />
              </button>
              {canUsePublicActions ? (
                <button
                  type="button"
                  disabled={toggleFavouriteMutation.isPending}
                  onClick={() => requireAuth(() => toggleFavouriteMutation.mutate())}
                  className="inline-flex h-10 w-10 items-center justify-center bg-black/35 text-white backdrop-blur-lg transition hover:bg-black/55 disabled:opacity-60"
                  aria-label={t("property.actions.shortlist", "Shortlist")}
                >
                  {toggleFavouriteMutation.isPending ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <Heart className={`h-4.5 w-4.5 ${isFavourite ? "fill-white" : ""}`} />
                  )}
                </button>
              ) : null}
            </div>
          </div>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
            <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 backdrop-blur-lg">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`h-1.5 transition-all ${idx === activeImageIndex ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
                  aria-label={`Photo ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content - single continuous div */}
        <div className="relative -mt-8 z-10">
          <div className="mx-4 bg-bg-page border border-border shadow-xl rounded-[28px]">
            {/* Price + Title */}
            <div className="px-5 pb-4 pt-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-extrabold text-text-primary leading-tight">
                    {listing?.property_title ?? t("property.title", "Property")}
                  </h1>
                  {listing?.location_text ? (
                    <div className="mt-1.5 flex items-center gap-1.5 text-sm text-text-tertiary">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-primary-400" />
                      <span className="line-clamp-1">{listing.location_text}</span>
                    </div>
                  ) : null}
                </div>
                <div className="shrink-0 bg-linear-to-br from-primary-500 to-tertiary-600 px-4 py-2.5 text-white shadow-sm rounded-2xl">
                  <div className="text-[10px] font-semibold uppercase tracking-wider opacity-90">
                    {t("explore.price_label", "Price")}
                  </div>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className="text-sm font-bold">{tCurrency(listing?.currency_code ?? "NPR")}</span>
                    <span className="text-lg font-extrabold">{formatPrice(listing?.price ?? 0, "")}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {listing?.property_category || listing?.property_category_name ? (
                  <span className="bg-primary-400/10 px-3 py-1 text-xs font-semibold text-primary-500 rounded-full">
                    {tPropertyCategory(listing.property_category_name || listing.property_category)}
                  </span>
                ) : null}
                {listing?.subcategory || listing?.subcategory_name ? (
                  <span className="bg-tertiary-400/10 px-3 py-1 text-xs font-semibold text-tertiary-600 dark:text-tertiary-400 rounded-full">
                    {tPropertySubcategory(listing?.subcategory || listing.subcategory_name || "")}
                  </span>
                ) : null}

                {listing?.view_count !== undefined && (
                  <div className="flex items-center gap-1 ml-auto text-xs font-medium text-text-tertiary">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{listing.view_count} {t("property.views", "views")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-5 h-px bg-border" />

            {listingQuery.isLoading ? (
              <div className="p-5 space-y-3">
                <div className="h-4 w-3/4 animate-pulse bg-secondary-200 dark:bg-secondary-700" />
                <div className="h-4 w-1/2 animate-pulse bg-secondary-200 dark:bg-secondary-700" />
                <div className="h-24 animate-pulse bg-secondary-200 dark:bg-secondary-700" />
              </div>
            ) : !listing ? (
              <div className="p-6 text-center text-text-secondary">
                {t("property.not_found", "Property not found.")}
              </div>
            ) : (
              <>
                {/* Description */}
                {description ? (
                  <div className="px-5 py-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                      <span className="h-1 w-1 bg-primary-400" />
                      {t("property.description_title", "Description")}
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-text-secondary">
                      {displayDescription}
                      {!showFullDescription && description.length > 420 ? "…" : ""}
                    </p>
                    {description.length > 420 ? (
                      <button
                        type="button"
                        onClick={() => setShowFullDescription((prev) => !prev)}
                        className="mt-2 text-sm font-semibold text-primary-500 transition hover:text-primary-400"
                      >
                        {showFullDescription ? t("common.show_less", "Show less") : t("common.show_more", "Show more")}
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {/* Divider */}
                {description ? <div className="mx-5 h-px bg-border" /> : null}

                {/* Walkthrough story */}
                {listing.is_story ? (
                  <>
                    <div className="px-5 py-5">
                      <PropertyWalkthroughSection listing={listing} isOwner={isOwner} />
                    </div>
                    <div className="mx-5 h-px bg-border" />
                  </>
                ) : null}

                {/* Amenities */}
                <div className="px-5 py-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <span className="h-1 w-1 bg-tertiary-400" />
                    {t("explore.amenities", "Amenities")}
                  </div>
                  <div className="mt-4 space-y-4">
                    {groupedAmenities.length ? (
                      groupedAmenities.map((group) => (
                        <div key={group.category_name}>
                          <div className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-text-tertiary">
                            {tAmenityCategory(group.category_name)}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {group.amenities.map((amenity) => (
                              <span
                                key={amenity.id}
                                className="bg-bg-input px-3.5 py-1.5 text-xs font-medium text-text-secondary border border-border rounded-full"
                              >
                                {tAmenity(amenity.code || amenity.name)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {amenityLabels.map((label) => (
                          <span
                            key={label}
                            className="bg-bg-input px-3.5 py-1.5 text-xs font-medium text-text-secondary border border-border rounded-full"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-5 h-px bg-border" />

                {/* View Map */}
                {hasMap ? (
                  <button
                    type="button"
                    onClick={() => requireAuth(() => setMobileMapOpen(true))}
                    disabled={!hasPoint}
                    className="flex w-full mb-32 items-center gap-3 px-5 py-4 text-left transition hover:bg-secondary-50 dark:hover:bg-secondary-900/30 disabled:opacity-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-tertiary-400/10 text-tertiary-600 dark:text-tertiary-400">
                      <Map className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-text-primary">
                        {t("map.view_map", "View Map")}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-text-tertiary">
                        {listing?.location_text ?? ""}
                      </div>
                    </div>
                    <ArrowLeft className="h-4 w-4 rotate-180 shrink-0 text-text-tertiary" />
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>

        {/* Fixed bottom bar */}
        {listing && !listingQuery.isLoading ? (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg-page/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.1)] backdrop-blur-xl">
            {renderListingAction("mobile")}
          </div>
        ) : null}

        {/* Mobile Map Bottom Sheet */}
        <MobileBottomSheet
          open={mobileMapOpen}
          title={t("property.map.title", "Map view")}
          description={listing?.location_text ?? ""}
          onClose={() => setMobileMapOpen(false)}
        >
          {hasPoint ? (
            <div className="h-[50dvh]">
              <CoverageMap
                center={{ latitude: lat, longitude: lng }}
                radiusMeters={listing?.show_exact_location ? 30 : 200}
                height={400}
                gesturesEnabled
                active
                variant={listing?.show_exact_location ? "pin" : "pulse"}
              />
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-text-secondary">
              {t("property.map.unavailable", "Location map unavailable.")}
            </div>
          )}
        </MobileBottomSheet>
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <main className={`hidden min-h-dvh md:block`}>
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 border border-border bg-bg-page px-4 py-2 text-sm font-semibold text-text-primary shadow-sm transition hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-2xl"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("common.back", "Back")}
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  requireAuth(async () => {
                    const url = typeof window !== "undefined" ? window.location.href : "";
                    if (!url) return;
                    const result = await shareOrCopy(url);
                    showToast({
                      variant: result === "failed" ? "error" : "success",
                      message:
                        result === "copied"
                          ? t("common.copied", "Copied to clipboard.")
                          : result === "shared"
                            ? t("common.shared", "Shared.")
                            : t("common.share_failed", "Could not share."),
                    });
                  })
                }
                className="inline-flex items-center gap-2 border border-border bg-bg-page px-4 py-2 text-sm font-semibold text-text-primary shadow-sm transition hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-2xl"
              >
                <Share2 className="h-4 w-4" />
                {t("common.share", "Share")}
              </button>
              {canUsePublicActions ? (
                <button
                  type="button"
                  disabled={toggleFavouriteMutation.isPending}
                  onClick={() => requireAuth(() => toggleFavouriteMutation.mutate())}
                  className="inline-flex items-center gap-2 border border-border bg-bg-page px-4 py-2 text-sm font-semibold text-text-primary shadow-sm transition hover:bg-secondary-100 disabled:opacity-60 dark:hover:bg-secondary-800 rounded-2xl"
                >
                  {toggleFavouriteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Heart className={`h-4 w-4 ${isFavourite ? "fill-primary-600 text-primary-600" : ""}`} />
                  )}
                  {isFavourite ? t("property.actions.shortlisted", "Saved") : t("property.actions.shortlist", "Save")}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-[1.4fr_1fr] gap-8">
            {/* Left - Images gallery */}
            <div className="space-y-5">
              <div className="overflow-hidden border border-border bg-bg-page shadow-sm rounded-[28px]">
                <div className="relative aspect-16/10 w-full bg-secondary-100 dark:bg-secondary-800">
                  <AnimatePresence initial={false}>
                    <motion.div
                      key={activeImageIndex}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.2 }}
                      drag={images.length > 1 ? "x" : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.3}
                      onDragEnd={(_, info) => {
                        if (images.length <= 1) return;
                        if (info.offset.x < -80) {
                          setActiveImageIndex((p) => Math.min(images.length - 1, p + 1));
                        } else if (info.offset.x > 80) {
                          setActiveImageIndex((p) => Math.max(0, p - 1));
                        }
                      }}
                      className="absolute inset-0 bg-white"
                    >
                      <Image
                        src={images[activeImageIndex] ?? noImagePlaceholder}
                        alt=""
                        fill
                        priority
                        unoptimized
                        className="object-cover pointer-events-none bg-linear-to-br  from-primary-500/50 via-primary-200 to-tertiary-500/50"
                        sizes="(max-width: 1280px) 60vw, 800px"
                        draggable={false}
                      />
                    </motion.div>
                  </AnimatePresence>
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/50" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <div className="flex gap-2 bg-black/25 px-3 py-2 backdrop-blur-lg">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`h-2 transition-all ${idx === activeImageIndex ? "w-6 bg-white" : "w-2 bg-white/45 hover:bg-white/70"}`}
                          aria-label={`Photo ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                  {images.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveImageIndex((p) => Math.max(0, p - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 p-2 text-white backdrop-blur-lg transition hover:bg-black/50"
                        aria-label="Previous"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveImageIndex((p) => Math.min(images.length - 1, p + 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 p-2 text-white backdrop-blur-lg transition hover:bg-black/50"
                        aria-label="Next"
                      >
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {images.length > 1 ? (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {images.map((src, idx) => (
                    <button
                      key={`thumb-${idx}`}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative h-20 w-28 shrink-0 overflow-hidden border-2 transition ${idx === activeImageIndex ? "border-primary-400" : "border-transparent opacity-70 hover:opacity-100"}`}
                    >
                      <Image src={src} alt="" fill unoptimized className="object-cover" sizes="112px" />
                    </button>
                  ))}
                </div>
              ) : null}

              {/* Description - desktop */}
              {description ? (
                <div className="border border-border bg-bg-page p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <span className="h-1 w-1 bg-primary-400" />
                    {t("property.description_title", "Description")}
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-text-secondary">
                    {displayDescription}
                    {!showFullDescription && description.length > 420 ? "…" : ""}
                  </p>
                  {description.length > 420 ? (
                    <button
                      type="button"
                      onClick={() => setShowFullDescription((prev) => !prev)}
                      className="mt-2 text-sm font-semibold text-primary-500 transition hover:text-primary-400"
                    >
                      {showFullDescription ? t("common.show_less", "Show less") : t("common.show_more", "Show more")}
                    </button>
                  ) : null}
                </div>
              ) : null}

              {/* View Map (desktop) */}
              {hasMap ? (
                <button
                  type="button"
                  onClick={() => requireAuth(() => setDesktopMapOpen(true))}
                  disabled={!hasPoint}
                  className="flex w-full items-center gap-4 border border-border bg-bg-page p-5 shadow-sm transition hover:bg-secondary-50 dark:hover:bg-secondary-900/30 disabled:opacity-50"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-tertiary-400/10 text-tertiary-600 dark:text-tertiary-400">
                    <Map className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-sm font-semibold text-text-primary">
                      {t("map.view_map", "View Map")}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-text-tertiary">
                      {listing?.location_text ?? ""}
                    </p>
                  </div>
                  <ArrowLeft className="h-4 w-4 rotate-180 shrink-0 text-text-tertiary" />
                </button>
              ) : null}

              {/* Walkthrough - desktop */}
              {listing?.is_story ? (
                <PropertyWalkthroughSection listing={listing} isOwner={isOwner} />
              ) : null}
            </div>

            {/* Right - Details */}
            <div className="space-y-5">
              {listingQuery.isLoading ? (
                <div className="border border-border bg-bg-page p-6">
                  <div className="space-y-4">
                    <div className="h-6 w-2/3 animate-pulse bg-secondary-200 dark:bg-secondary-700" />
                    <div className="h-4 w-1/3 animate-pulse bg-secondary-200 dark:bg-secondary-700" />
                    <div className="h-4 w-1/2 animate-pulse bg-secondary-200 dark:bg-secondary-700" />
                    <div className="h-20 animate-pulse bg-secondary-200 dark:bg-secondary-700" />
                  </div>
                </div>
              ) : !listing ? (
                <div className="border border-border bg-bg-page p-6 text-center text-text-secondary">
                  {t("property.not_found", "Property not found.")}
                </div>
              ) : (
                <>
                  {/* Info card */}
                  <div className="border border-border bg-bg-page p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h1 className="text-2xl font-extrabold text-text-primary">
                          {listing.property_title}
                        </h1>
                        {listing.location_text ? (
                          <div className="mt-2 flex items-center gap-1.5 text-sm text-text-tertiary">
                            <MapPin className="h-4 w-4 text-primary-500" />
                            <span>{listing.location_text}</span>
                          </div>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="bg-primary-400/10 px-3.5 py-1 text-xs font-semibold text-primary-500 rounded-full">
                            {tPropertyCategory(listing?.property_category || listing.property_category_name)}
                          </span>
                          {listing.subcategory || listing.subcategory_name ? (
                            <span className="bg-tertiary-400/10 px-3.5 py-1 text-xs font-semibold text-tertiary-600 dark:text-tertiary-400 rounded-full">
                              {tPropertySubcategory(listing.subcategory || listing.subcategory_name || "")}
                            </span>
                          ) : null}

                          {listing?.view_count !== undefined && (
                            <div className="flex items-center gap-1.5 ml-auto text-sm font-medium text-text-tertiary">
                              <Eye className="h-4 w-4" />
                              <span>{listing.view_count} {t("property.views", "views")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 bg-linear-to-br from-primary-500 via-primary-500 to-tertiary-500 px-5 py-3 text-white shadow-sm rounded-2xl">
                        <div className="text-[10px] font-semibold uppercase tracking-wider opacity-90">
                          {t("explore.price_label", "Price")}
                        </div>
                        <div className="mt-0.5 flex items-baseline gap-1">
                          <span className="text-sm font-bold">{tCurrency(listing.currency_code ?? "NPR")}</span>
                          <span className="text-xl font-extrabold">{formatPrice(listing.price, "")}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="border border-border bg-bg-page p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                      <span className="h-1 w-1 bg-tertiary-400" />
                      {t("explore.amenities", "Amenities")}
                    </div>
                    <div className="mt-4 space-y-5">
                      {groupedAmenities.length ? (
                        groupedAmenities.map((group) => (
                          <div key={group.category_name}>
                            <div className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-text-tertiary">
                              {tAmenityCategory(group.category_code || group.category_name)}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {group.amenities.map((amenity) => (
                                <span
                                  key={amenity.id}
                                  className="bg-bg-input px-4 py-1.5 text-xs font-medium text-text-secondary border border-border rounded-full"
                                >
                                  {tAmenity(amenity.code || amenity.name)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {amenityLabels.map((label) => (
                            <span
                              key={label}
                              className="bg-bg-input px-4 py-1.5 text-xs font-medium text-text-secondary border border-border rounded-full"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border border-border bg-bg-page p-6 shadow-sm">
                    <div className="text-sm font-semibold text-text-primary">
                      {t("property.actions.title", "Actions")}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {renderListingAction("desktop")}
                      <button
                        type="button"
                        onClick={() =>
                          requireAuth(async () => {
                            const url = typeof window !== "undefined" ? window.location.href : "";
                            if (!url) return;
                            const result = await shareOrCopy(url);
                            showToast({
                              variant: result === "failed" ? "error" : "success",
                              message:
                                result === "copied"
                                  ? t("common.copied", "Copied to clipboard.")
                                  : result === "shared"
                                    ? t("common.shared", "Shared.")
                                    : t("common.share_failed", "Could not share."),
                            });
                          })
                        }
                        className="inline-flex items-center gap-2  border border-border bg-bg-page px-6 py-3 text-sm font-semibold text-text-primary shadow-sm transition hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-2xl"
                      >
                        <Share2 className="h-4 w-4" />
                        {t("common.share", "Share")}
                      </button>
                    </div>

                    <div className="mt-5 bg-linear-to-br from-primary-400/5 to-tertiary-400/5 px-4 py-3 border border-primary-400/10">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-text-primary">
                          {t("explore.price_label", "Price")}
                        </span>
                        <span className="font-semibold text-text-primary">
                          {formatPrice(listing.price, listing.currency_code)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-text-primary">
                          {t("property.quick.category", "Category")}
                        </span>
                        <span className="text-text-secondary">{listing.property_category}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Desktop Map Modal */}
      {desktopMapOpen ? (
        <div className="fixed inset-0 z-85 hidden md:block">
          <button
            type="button"
            aria-label="Close map"
            onClick={() => setDesktopMapOpen(false)}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          />
          <div className="relative mx-auto flex min-h-full w-full max-w-4xl items-center justify-center px-4 py-10">
            <div className="w-full overflow-hidden border border-border bg-bg-page shadow-xl">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-text-primary">
                    {t("property.map.title", "Map view")}
                  </h2>
                  <p className="mt-0.5 truncate text-sm text-text-secondary">
                    {listing?.location_text ?? ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDesktopMapOpen(false)}
                  className="border border-border bg-bg-input px-3 py-2 text-sm font-semibold text-text-primary transition hover:bg-secondary-100 dark:hover:bg-secondary-800"
                >
                  {t("common.close", "Close")}
                </button>
              </div>
              <div className="aspect-16/10 w-full bg-secondary-100 dark:bg-secondary-800">
                {hasPoint ? (
                  <div className="h-full w-full p-4">
                    <CoverageMap
                      center={{ latitude: lat, longitude: lng }}
                      radiusMeters={listing?.show_exact_location ? 30 : 200}
                      height={420}
                      gesturesEnabled
                      active
                      variant={listing?.show_exact_location ? "pin" : "pulse"}
                    />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-text-secondary">
                    {t("property.map.unavailable", "Exact map location is not available for this property.")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function PropertyWalkthroughSection({
  listing,
  isOwner,
}: {
  listing: ExploreListing;
  isOwner: boolean;
}) {
  const listingId = listing.id;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);

  const storyQuery = useQuery({
    queryKey: ["property-story", listingId],
    queryFn: () => storiesService.getActiveStoriesForProperty(listingId),
    enabled: Boolean(listingId),
  });

  const stories = storyQuery.data ?? [];
  const imageStories = stories.filter(s => !/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(s.media_url));
  const videoStories = stories.filter(s => /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(s.media_url));

  const imageLimit = listing.story_image_limit ?? 5;
  const videoLimit = listing.story_video_limit ?? 5;

  const imageRemaining = Math.max(0, imageLimit - imageStories.length);
  const videoRemaining = Math.max(0, videoLimit - videoStories.length);

  const publishMutation = useMutation({
    mutationFn: async ({ file, thumbnailFile }: { file: File; thumbnailFile?: File }) => {
      if (!file) {
        throw new Error(t("property.story.no_file", "No file selected."));
      }
      
      const isVideo = file.type?.startsWith("video/") ?? false;
      
      if (isVideo && videoRemaining <= 0) {
        throw new Error(t("property.story.video_limit_reached", "Video limit reached."));
      }
      if (!isVideo && imageRemaining <= 0) {
        throw new Error(t("property.story.image_limit_reached", "Image limit reached."));
      }

      // Enforce 1MB limit for image, 10MB for video
      const limit = isVideo ? 10 * 1024 * 1024 : 1 * 1024 * 1024;
      if (file.size > limit) {
         throw new Error(isVideo 
           ? t("property.story.video_too_big", "Video is too big (max 10MB).")
           : t("property.story.image_too_big", "Image is too big (max 1MB).")
         );
      }

      const folder = isVideo ? "property-walkthrough-story/videos" : "property-walkthrough-story/images";
      const { publicUrl: mediaUrl, objectKey: mediaKey } = await uploadToR2({ file: file, folder });

      let thumbnailUrl: string | null = null;
      let thumbnailKey: string | undefined = undefined;

      if (thumbnailFile) {
        const thumbResult = await uploadToR2({ 
          file: thumbnailFile, 
          folder: "property-walkthrough-story/thumbnails" 
        });
        thumbnailUrl = thumbResult.publicUrl;
        thumbnailKey = thumbResult.objectKey;
      }

      await storiesService.upsertStory({
        propertyId: listingId,
        mediaUrl,
        thumbnailUrl,
        mediaKey,
        thumbnailKey,
      });

    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["property-story", listingId] });
      showToast({
        variant: "success",
        message: t("property.story.published"),
      });
      setCameraOpen(false);
    },
    onError: (err: any) => {
      showToast({
        variant: "error",
        message: err?.message ?? t("property.story.publish_failed"),
      });
    },
  });

  const selected = stories.find((s) => s.story_id === selectedStoryId) ?? stories[0] ?? null;

  useEffect(() => {
    if (!selectedStoryId && stories.length > 0) setSelectedStoryId(stories[0]!.story_id);
    if (selectedStoryId && stories.length > 0 && !stories.some((s) => s.story_id === selectedStoryId)) {
      setSelectedStoryId(stories[0]!.story_id);
    }
    if (stories.length === 0) setSelectedStoryId(null);
  }, [selectedStoryId, stories]);

  const isProbablyVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);

  const handleCameraCapture = (file: File) => {
    publishMutation.mutate({ file });
  };

  const handleCloseCamera = () => {
    setCameraOpen(false);
  };

  return (
    <div className="border border-border bg-bg-page p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <span className="h-1 w-1 bg-tertiary-400" />
        {t("property.story.title")}
      </div>
      <p className="mt-1 text-xs text-text-tertiary">Upload a video (max 30s, 10MB) or photo (max 1MB) for your property.</p>

      {storyQuery.isLoading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("property.loading_listing")}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {selected ? (
            <>
              {isProbablyVideoUrl(selected.media_url) ? (
                <video
                  src={selected.media_url}
                  controls
                  playsInline
                  className="aspect-video w-full overflow-hidden bg-black"
                />
              ) : (
                <img
                  src={selected.media_url}
                  alt={t("property.story.preview_alt", "Walkthrough story")}
                  className="aspect-video w-full overflow-hidden bg-black object-cover"
                />
              )}

              {stories.length > 1 ? (
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {stories.map((s) => {
                    const isActive = s.story_id === selected.story_id;
                    return (
                      <button
                        key={s.story_id}
                        type="button"
                        onClick={() => setSelectedStoryId(s.story_id)}
                        className={cn(
                          "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-black",
                          isActive ? "border-primary-500" : "border-border"
                        )}
                        title={new Date(s.created_at).toLocaleString()}
                      >
                        {isProbablyVideoUrl(s.media_url) ? (
                          <video
                            src={s.media_url}
                            muted
                            playsInline
                            preload="metadata"
                            className="h-full w-full object-cover opacity-90"
                          />
                        ) : (
                          <img src={s.media_url} alt="" className="h-full w-full object-cover" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div className="text-xs text-text-tertiary">
                {t("property.story.expires")}: {new Date(selected.expires_at).toLocaleString()}
              </div>
            </>
          ) : !isOwner ? (
            <p className="text-sm text-text-secondary">{t("property.story.none_visitor")}</p>
          ) : null}

          {isOwner ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-text-tertiary">
                  {t("property.story.image_limit", { defaultValue: "Images left today: {{remaining}}/{{max}}", remaining: imageRemaining, max: imageLimit })}
                </div>
                <div className="text-xs text-text-tertiary">
                  {t("property.story.video_limit", { defaultValue: "Videos left today: {{remaining}}/{{max}}", remaining: videoRemaining, max: videoLimit })}
                </div>
                {imageRemaining <= 0 && videoRemaining <= 0 ? (
                  <div className="text-xs font-semibold text-destructive">
                    {t("property.story.limit_reached", "Limit reached (24 hours).")}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  disabled={publishMutation.isPending || imageRemaining <= 0}
                  onClick={() => setCameraOpen(true)}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 border border-dashed border-border bg-bg-input px-4 py-4 text-center text-sm font-semibold text-text-primary transition hover:bg-secondary-100 dark:hover:bg-secondary-800",
                    (publishMutation.isPending || imageRemaining <= 0) && "opacity-60"
                  )}
                >
                  {t("property.story.take_photo_cta", "Take Photo")}
                </button>

                <label
                  className={cn(
                    "flex cursor-pointer items-center justify-center gap-2 border border-dashed border-border bg-bg-input px-4 py-4 text-center text-sm font-semibold text-text-primary transition hover:bg-secondary-100 dark:hover:bg-secondary-800",
                    (publishMutation.isPending || imageRemaining <= 0) && "cursor-not-allowed opacity-60"
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={publishMutation.isPending || imageRemaining <= 0}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) publishMutation.mutate({ file });
                    }}
                  />
                  {t("property.story.upload_image", "Upload Image")}
                </label>

                <label
                  className={cn(
                    "flex cursor-pointer items-center justify-center gap-2 border border-dashed border-border bg-bg-input px-4 py-4 text-center text-sm font-semibold text-text-primary transition hover:bg-secondary-100 dark:hover:bg-secondary-800",
                    (publishMutation.isPending || videoRemaining <= 0) && "cursor-not-allowed opacity-60"
                  )}
                >
                  <input
                    type="file"
                    accept="video/*"
                    className="sr-only"
                    disabled={publishMutation.isPending || videoRemaining <= 0}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;

                      try {
                        if (file.size > MAX_VIDEO_UPLOAD_SIZE) {
                          showToast({ variant: "error", message: "Video too large (max 20MB)." });
                          return;
                        }
                        const duration = await getVideoDuration(file);
                        if (duration > MAX_VIDEO_DURATION) {
                          showToast({ variant: "error", message: "Video too long (max 30s)." });
                          return;
                        }
                        publishMutation.mutate({ file });
                      } catch (err) {
                        showToast({ variant: "error", message: "Could not read video." });
                      }
                    }}
                  />
                  {t("property.story.upload_video", "Upload Video")}
                </label>
              </div>

              {publishMutation.isPending ? (
                <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("property.story.uploading")}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCapture
        open={cameraOpen}
        onClose={handleCloseCamera}
        onCapture={handleCameraCapture}
        busy={publishMutation.isPending}
      />
    </div>
  );
}

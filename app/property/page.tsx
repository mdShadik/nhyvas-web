"use client";

import Image, { StaticImageData } from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Heart,
  Link as LinkIcon,
  Loader2,
  Map,
  MapPin,
  MessageCircle,
  Share2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { noImagePlaceholder } from "@/assets";
import {
  authApi,
  chatService,
  exploreService,
  favouritesService,
  leadsService,
} from "@/services/apiService";
import type { ExploreListing } from "@/services/apiService/explore";
import { formatPrice } from "@/lib/formatPrice";
import { tAmenity, tCurrency } from "@/i18n/masterData";
import { pageBgClass } from "@/constant";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { LoginModal } from "@/components/auth/LoginModal";
import { useToast } from "@/context/ToastContext";
import { CoverageMap } from "@/components/map/CoverageMap";

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

export default function PropertyPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const id = searchParams.get("id")?.trim() || "";
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

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

  const { data: currentUserId } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.getCurrentUserId,
  });

  const listingQuery = useQuery({
    queryKey: ["listing-details", id],
    queryFn: () => exploreService.getListingDetails(id),
    enabled: Boolean(id),
  });

  const listing = listingQuery.data ?? null;
  const isOwner = Boolean(currentUserId && listing?.listed_by && listing.listed_by === currentUserId);

  const favouriteIdsQuery = useQuery({
    queryKey: ["listing-details-favorite", id],
    queryFn: () => favouritesService.getMyFavouriteListingIdsForListings([id]),
    enabled: Boolean(id) && !isOwner,
  });
  const isFavourite = (favouriteIdsQuery.data ?? []).includes(id);

  const myLeadQuery = useQuery({
    queryKey: ["listing-my-lead", id, currentUserId],
    queryFn: async () => {
      if (!id || !currentUserId) return [];
      const leads = await leadsService.getLeadsForListing(id);
      return leads.filter((lead) => lead.inquirer_id === currentUserId);
    },
    enabled: Boolean(id && currentUserId) && !isOwner,
  });
  const hasInterested = (myLeadQuery.data ?? []).length > 0;

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
  const activeImage = images[Math.min(activeImageIndex, Math.max(0, images.length - 1))] ?? noImagePlaceholder;

  const amenityLabels = useMemo(() => {
    return (listing?.amenity_tags ?? [])
      .map((raw) => (typeof raw === "string" ? raw.trim() : ""))
      .filter(Boolean)
      .map((name) => tAmenity(name));
  }, [listing?.amenity_tags]);

  const description = (listing?.description ?? "").trim();
  const displayDescription = showFullDescription ? description : description.slice(0, 420);

  if (!id) {
    return (
      <main className={`min-h-screen ${pageBgClass}`}>
        <div className="mx-auto w-full max-w-3xl px-4 py-10">
          <div className="rounded-3xl border border-border bg-bg-card p-6 text-text-secondary">
            {t("property.missing_id", "Missing property id.")}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${pageBgClass}`}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-card px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-secondary-100 dark:hover:bg-secondary-800"
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
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg-card text-text-primary transition hover:bg-secondary-100 dark:hover:bg-secondary-800"
              aria-label={t("common.share", "Share")}
            >
              <Share2 className="h-5 w-5" />
            </button>

            <button
              type="button"
              disabled={isOwner || toggleFavouriteMutation.isPending}
              onClick={() => requireAuth(() => toggleFavouriteMutation.mutate())}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg-card text-text-primary transition hover:bg-secondary-100 disabled:opacity-60 dark:hover:bg-secondary-800"
              aria-label={t("property.actions.shortlist", "Shortlist")}
            >
              {toggleFavouriteMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Heart className={`h-5 w-5 ${isFavourite ? "fill-primary-600 text-primary-600" : ""}`} />
              )}
            </button>
          </div>
        </div>

        <LoginModal
          open={loginOpen}
          nextUrl={nextUrl}
          onClose={() => setLoginOpen(false)}
          title={t("auth.login_required", "Login required")}
          description={t(
            "auth.login_required_desc",
            "Please sign in to continue with this action."
          )}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          <section className="space-y-6">
            {/* Media */}
            <PropertyHero
              title={listing?.property_title ?? t("property.title", "Property")}
              images={images}
              activeIndex={activeImageIndex}
              onChangeIndex={setActiveImageIndex}
              isFavourite={isFavourite}
              favouriteBusy={toggleFavouriteMutation.isPending}
              onShare={() =>
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
              onToggleFavourite={() => requireAuth(() => toggleFavouriteMutation.mutate())}
            />

            {/* Main info */}
            <div className="rounded-[28px] border border-border bg-bg-card p-5 shadow-sm sm:p-6">
              {listingQuery.isLoading ? (
                <div className="space-y-3">
                  <div className="h-7 w-2/3 animate-pulse rounded bg-secondary-200 dark:bg-secondary-700" />
                  <div className="h-5 w-1/2 animate-pulse rounded bg-secondary-200 dark:bg-secondary-700" />
                  <div className="h-10 w-1/3 animate-pulse rounded bg-secondary-200 dark:bg-secondary-700" />
                </div>
              ) : listing ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h1 className="text-2xl font-semibold text-text-primary sm:text-3xl">
                        {listing.property_title}
                      </h1>
                      <div className="mt-2 flex items-center gap-2 text-sm text-text-secondary">
                        <MapPin className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        <span className="line-clamp-1">{listing.location_text}</span>
                      </div>
                    </div>

                    <div className="shrink-0 rounded-2xl bg-primary-100 px-4 py-3 text-primary-800 dark:bg-primary-900/35 dark:text-primary-200">
                      <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
                        {t("property.price", "Price")}
                      </div>
                      <div className="mt-1 text-xl font-extrabold">
                        {formatPrice(listing.price, listing.currency_code)}
                      </div>
                      <div className="mt-0.5 text-xs opacity-80">{tCurrency(listing.currency_code)}</div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-text-secondary dark:bg-secondary-800">
                      {listing.property_category}
                    </span>
                    {listing.subcategory ? (
                      <span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-text-secondary dark:bg-secondary-800">
                        {listing.subcategory}
                      </span>
                    ) : null}
                  </div>

                  {description ? (
                    <div className="mt-6">
                      <div className="text-sm font-semibold text-text-primary">
                        {t("property.description", "Description")}
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-text-secondary">
                        {displayDescription}
                        {!showFullDescription && description.length > 420 ? "…" : ""}
                      </p>
                      {description.length > 420 ? (
                        <button
                          type="button"
                          onClick={() => setShowFullDescription((prev) => !prev)}
                          className="mt-2 text-sm font-semibold text-primary-600 transition hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          {showFullDescription ? t("common.show_less", "Show less") : t("common.show_more", "Show more")}
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-6">
                    <div className="text-sm font-semibold text-text-primary">
                      {t("property.amenities", "Amenities")}
                    </div>
                    {amenityLabels.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {amenityLabels.map((label) => (
                          <span
                            key={label}
                            className="rounded-full border border-border bg-bg-input px-3 py-2 text-sm font-medium text-text-secondary"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-text-secondary">
                        {t("property.no_amenities", "No amenities listed.")}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-text-secondary">
                  {t("property.not_found", "Property not found.")}
                </div>
              )}
            </div>
          </section>

          {/* Actions */}
          <aside className="lg:sticky lg:top-24">
            <div className="rounded-[28px] border border-border bg-bg-card p-5 shadow-sm sm:p-6">
              <div className="text-lg font-semibold text-text-primary">
                {t("property.actions.title", "Actions")}
              </div>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  disabled={isOwner || hasInterested || createLeadMutation.isPending}
                  onClick={() => requireAuth(() => createLeadMutation.mutate())}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 disabled:opacity-60"
                >
                  {createLeadMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                  {hasInterested
                    ? t("property.actions.interested_done", "Interest sent")
                    : t("property.actions.interested", "I’m interested")}
                </button>

                <button
                  type="button"
                  disabled={isOwner || createChatRoomMutation.isPending}
                  onClick={() => requireAuth(() => createChatRoomMutation.mutate())}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-bg-input px-5 py-3 text-sm font-semibold text-text-primary transition hover:bg-secondary-100 disabled:opacity-60 dark:hover:bg-secondary-800"
                >
                  {createChatRoomMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="h-4 w-4" />
                  )}
                  {t("property.actions.chat", "Chat with owner")}
                </button>

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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-bg-card px-5 py-3 text-sm font-semibold text-text-primary transition hover:bg-secondary-100 dark:hover:bg-secondary-800"
                >
                  <Share2 className="h-4 w-4" />
                  {t("common.share", "Share")}
                </button>

                <button
                  type="button"
                  disabled={!listing || listing.latitude == null || listing.longitude == null}
                  onClick={() =>
                    requireAuth(() => {
                      setMapOpen(true);
                    })
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-bg-card px-5 py-3 text-sm font-semibold text-text-primary transition hover:bg-secondary-100 disabled:opacity-60 dark:hover:bg-secondary-800"
                >
                  <Map className="h-4 w-4" />
                  {t("property.actions.view_map", "View map")}
                </button>
              </div>

              {listing ? (
                <div className="mt-6 rounded-2xl border border-border bg-bg-input px-4 py-4 text-sm text-text-secondary">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-text-primary">
                      {t("property.quick.price", "Price")}
                    </span>
                    <span className="font-semibold text-text-primary">
                      {formatPrice(listing.price, listing.currency_code)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="font-semibold text-text-primary">
                      {t("property.quick.category", "Category")}
                    </span>
                    <span className="truncate">{listing.property_category}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>

      <PropertyMapModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        listing={listing}
      />
    </main>
  );
}

function PropertyHero({
  title,
  images,
  activeIndex,
  onChangeIndex,
  isFavourite,
  favouriteBusy,
  onShare,
  onToggleFavourite,
}: {
  title: string;
  images: string[] | StaticImageData[];
  activeIndex: number;
  onChangeIndex: (next: number) => void;
  isFavourite: boolean;
  favouriteBusy: boolean;
  onShare: () => void;
  onToggleFavourite: () => void;
}) {
  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

  const safeImages = images.length ? images : [noImagePlaceholder];
  const listingImage = safeImages[activeIndex] ?? safeImages[0] ?? noImagePlaceholder;

  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-bg-card shadow-sm">
      <div className="group relative aspect-16/10 w-full bg-secondary-100 dark:bg-secondary-800">
        <AnimatePresence initial={false}>
          <motion.div
            key={`${activeIndex}-${listingImage}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            drag={safeImages.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(_, info) => {
              if (safeImages.length <= 1) return;
              const swipe = swipePower(info.offset.x, info.velocity.x);
              if (swipe < -swipeConfidenceThreshold) {
                onChangeIndex(Math.min(activeIndex + 1, safeImages.length - 1));
              } else if (swipe > swipeConfidenceThreshold) {
                onChangeIndex(Math.max(activeIndex - 1, 0));
              }
            }}
            className="absolute inset-0"
          >
            <Image
              src={listingImage}
              alt={title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 800px"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-black/15 to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
          <div className="rounded-full bg-black/35 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            {safeImages.length} photo{safeImages.length === 1 ? "" : "s"}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onShare}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/55"
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onToggleFavourite}
              disabled={favouriteBusy}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/55 disabled:opacity-60"
              aria-label="Save"
            >
              {favouriteBusy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Heart className={`h-5 w-5 ${isFavourite ? "fill-white" : ""}`} />
              )}
            </button>
          </div>
        </div>

        {safeImages.length > 1 ? (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="flex gap-2 rounded-full bg-black/30 px-3 py-2 backdrop-blur-md">
              {safeImages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChangeIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === activeIndex ? "w-6 bg-white" : "w-2 bg-white/45 hover:bg-white/70"
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {safeImages.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto border-t border-border bg-bg-card px-4 py-3">
          {safeImages.map((src, idx) => (
            <button
              key={`${src}-${idx}`}
              type="button"
              onClick={() => onChangeIndex(idx)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-2xl border transition ${
                idx === activeIndex ? "border-primary-400" : "border-border hover:border-primary-200"
              }`}
              aria-label={`Image ${idx + 1}`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="96px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PropertyMapModal({
  open,
  onClose,
  listing,
}: {
  open: boolean;
  onClose: () => void;
  listing: ExploreListing | null;
}) {
  const { t } = useTranslation();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [open]);

  const lat =
    listing?.latitude != null
      ? Number(listing.latitude)
      : NaN;

  const lng =
    listing?.longitude != null
      ? Number(listing.longitude)
      : NaN;

  const hasPoint =
    Number.isFinite(lat) &&
    Number.isFinite(lng);

  // Hooks must run before conditional returns
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close map"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative mx-auto flex min-h-full w-full max-w-4xl items-center justify-center px-4 py-10">
        <div className="w-full overflow-hidden rounded-[28px] border border-border bg-bg-card shadow-xl">
          
          {/* Header */}
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
              onClick={onClose}
              className="rounded-2xl border border-border bg-bg-input px-3 py-2 text-sm font-semibold text-text-primary transition hover:bg-secondary-100 dark:hover:bg-secondary-800"
            >
              {t("common.close", "Close")}
            </button>
          </div>

          {/* Content */}
          <div className="aspect-[16/10] w-full bg-secondary-100 dark:bg-secondary-800">
            {hasPoint ? (
              <div className="h-full w-full p-4">
                <CoverageMap
                  center={{
                    latitude: lat,
                    longitude: lng,
                  }}
                  radiusMeters={
                    listing?.show_exact_location
                      ? 30
                      : 200
                  }
                  height={420}
                  gesturesEnabled
                  active
                  variant={
                    listing?.show_exact_location
                      ? "pin"
                      : "pulse"
                  }
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-text-secondary">
                {t(
                  "property.map.unavailable",
                  "Exact map location is not available for this property."
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
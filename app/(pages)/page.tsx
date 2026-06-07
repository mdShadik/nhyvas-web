"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, MapPin, ArrowRight } from "lucide-react";
import { exploreService } from "@/services/apiService";
import { logoSingleN, noImagePlaceholder } from "../../assets";
import { formatPrice } from "@/lib/formatPrice";
import { ExploreFiltersPanel } from "@/components/explore/ExploreFiltersPanel";
import { EMPTY_FILTERS, type FilterState } from "@/components/explore/exploreFilters";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { useTranslation } from "react-i18next";
import { tPropertyCategory } from "@/i18n/masterData";
import { StoryFeed } from "@/components/stories/StoryFeed";
import { type ExploreListing } from "@/services/apiService/explore";
import { useUserLocation } from "@/hooks/useUserLocation";

type HeroListing = Awaited<ReturnType<typeof exploreService.getHomeHeroListings>>[number];

function NearbyPropertyCard({ listing }: { listing: ExploreListing }) {
  const { t } = useTranslation();
  return (
    <Link
      href={{ pathname: "/property", query: { id: listing.id } }}
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-bg-card/40 p-2 transition-all hover:border-primary-500/30 hover:shadow-lg dark:hover:bg-bg-card/60"
    >
      <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-secondary-100 dark:bg-secondary-800">
        <Image
          src={listing.thumbnail_url || noImagePlaceholder}
          alt={listing.property_title}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-115 scale-110"
          sizes="128px"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center py-2.5">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="truncate text-[11px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-400">
            {tPropertyCategory(listing.property_category_name || listing.property_category)}
          </span>
        </div>
        <h3 className="mt-1 line-clamp-2 text-[15px] font-bold leading-tight text-text-primary">
          {listing.property_title}
        </h3>
        <div className="mt-1.5 flex items-center gap-1 text-[12px] text-text-secondary">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary-500" />
          <span className="truncate">{listing.location_text}</span>
        </div>
        <div className="mt-2 text-base font-black text-primary-600 dark:text-primary-400">
          {formatPrice(listing.price, listing.currency_code)}
        </div>
      </div>
    </Link>
  );
}

function NearbyListingSkeleton() {
  return (
    <div className="flex w-[310px] shrink-0 items-center gap-4 rounded-2xl border border-border bg-bg-card/40 p-2">
      <div className="h-32 w-32 shrink-0 animate-pulse rounded-xl bg-secondary-100 dark:bg-secondary-800" />
      <div className="flex flex-1 flex-col gap-2.5 py-2.5">
        <div className="h-3 w-16 animate-pulse rounded bg-secondary-100 dark:bg-secondary-800" />
        <div className="h-4 w-full animate-pulse rounded bg-secondary-100 dark:bg-secondary-800" />
        <div className="h-3 w-24 animate-pulse rounded bg-secondary-100 dark:bg-secondary-800" />
        <div className="h-4 w-20 animate-pulse rounded bg-secondary-100 dark:bg-secondary-800" />
      </div>
    </div>
  );
}

function CategoryPropertiesSection({ 
  title, 
  categoryId, 
  listings, 
  isLoading 
}: { 
  title: string; 
  categoryId: string; 
  listings: ExploreListing[]; 
  isLoading?: boolean 
}) {
  const { t } = useTranslation();

  if (!isLoading && listings.length === 0) return null;

  return (
    <section className="mt-14">
      <div className="relative">
        <div className="flex items-end justify-between gap-4">
          <div className="relative">
            {/* Decorative line accent */}
            <div className="absolute -left-4 top-1 hidden h-8 w-1 rounded-full bg-linear-to-b from-primary-500 to-tertiary-500 sm:block" />

            <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-text-secondary">
              {t("home.category_explore_near_you", { category: title })}
            </p>
          </div>

          <Link
            href={{
              pathname: "/explore",
              query: { categories: categoryId },
            }}
            className="group/link inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-card px-4 py-2 text-sm font-semibold text-primary-600 shadow-sm transition-all hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5 dark:text-primary-400 dark:hover:border-primary-500/50"
          >
            {t("common.view_all")}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>

        {/* Divider after title */}
        <div className="mt-6 h-px w-full bg-linear-to-r from-border via-border/20 to-border" />
      </div>

      <div className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 pt-6 sm:mx-0 sm:px-0">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <NearbyListingSkeleton key={i} />)
        ) : (
          listings.map((listing) => (
            <div key={listing.id} className="w-[310px] shrink-0 sm:w-[350px]">
              <NearbyPropertyCard listing={listing} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function HeroBannerSkeleton() {
  return (
    <div className="relative animate-pulse overflow-hidden rounded-[28px] border border-border bg-secondary-100 dark:bg-secondary-800">
      <div className="h-95 w-full bg-secondary-200/70 dark:bg-secondary-700/50 sm:h-110" />
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

function HeroBanner({ listings }: { listings: HeroListing[] }) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

  const paginate = (newDirection: number) => {
    if (newDirection === 1 && currentIndex === listings.length - 1) return;
    if (newDirection === -1 && currentIndex === 0) return;
    setDirection(newDirection);
    setCurrentIndex((prev) => prev + newDirection);
  };

  if (!listings.length) return null;

  const listing = listings[currentIndex];

  return (
    <div
      className="group relative min-h-95 overflow-hidden rounded-[28px] border border-border shadow-xl shadow-primary-500/5 sm:min-h-110 bg-secondary-100 dark:bg-secondary-800 dark:shadow-primary-500/10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(_e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);
            if (swipe < -swipeConfidenceThreshold) paginate(1);
            else if (swipe > swipeConfidenceThreshold) paginate(-1);
          }}
          className="absolute inset-0"
        >
          <Image
            src={listing.thumbnail_url || noImagePlaceholder}
            alt={listing.property_title}
            fill
            priority
            className="object-cover pointer-events-none scale-105 transition-transform duration-[8000ms] ease-out group-hover:scale-110"
            sizes="100vw"
          />

          {/* Multi-layered overlays for depth */}
          <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/50 to-black/10 pointer-events-none" />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-linear-to-br from-primary-900/30 via-transparent to-tertiary-900/20 pointer-events-none mix-blend-overlay" />

          {/* Decorative grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-10 pointer-events-none">
            {/* Top badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative overflow-hidden rounded-full w-fit bg-linear-to-r from-primary-500 to-tertiary-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-primary-500/30 backdrop-blur-md">
                <div className="absolute inset-0 overflow-hidden rounded-full">
                  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/40 to-transparent" />
                </div>
                <span className="relative z-10 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  {t("home.badge_featured")}
                </span>
              </div>
            </div>

            <div className="max-w-2xl mt-auto">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-tertiary-400 animate-pulse" />
                {t("home.prime_listing")}
              </p>

              <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl drop-shadow-lg">
                {listing.property_title}
              </h1>

              <p className="mt-3 flex items-center gap-1.5 text-sm text-white/85 sm:text-base">
                <MapPin className="h-4 w-4 shrink-0" />
                {listing.location_text}
              </p>

              <div className="mt-5 flex items-baseline gap-2">
                <div className="text-2xl font-bold text-white sm:text-4xl bg-linear-to-r from-white to-white/80 bg-clip-text text-transparent">
                  {formatPrice(listing.price, listing.currency_code)}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={{ pathname: "/property", query: { id: listing.id } }}
                  className="group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-linear-to-br from-primary-500 via-primary-600 to-tertiary-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/40 transition-all hover:shadow-xl hover:shadow-primary-500/50 hover:-translate-y-0.5 active:translate-y-0 pointer-events-auto cursor-pointer"
                >
                  <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
                  <span className="relative">{t("home.view_property")}</span>
                  <ArrowRight className="relative h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>

                <Link
                  href="/explore"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/40 pointer-events-auto cursor-pointer"
                >
                  {t("home.browse_all_listings")}
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {currentIndex > 0 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/60 hover:scale-110 opacity-0 group-hover:opacity-100"
          onClick={() => paginate(-1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {currentIndex < listings.length - 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/60 hover:scale-110 opacity-0 group-hover:opacity-100"
          onClick={() => paginate(1)}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {listings.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-2 backdrop-blur-md">
          {listings.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIndex
                  ? "w-8 bg-linear-to-r from-primary-400 to-tertiary-400"
                  : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [search] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<FilterState>({ ...EMPTY_FILTERS });

  const { userLocation, isLocating } = useUserLocation();

  const heroQuery = useQuery({
    queryKey: ["home", "hero"],
    queryFn: () => exploreService.getHomeHeroListings(8),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const groupedQuery = useQuery({
    queryKey: ["home", "grouped-listings", userLocation],
    queryFn: () => exploreService.getHomeGroupedListings({
      userLat: userLocation?.latitude,
      userLng: userLocation?.longitude,
      userRadiusKm: 10,
      listingsPerCategory: 5,
    }),
    enabled: !isLocating,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const heroListings = heroQuery.data ?? [];
  const groupedCategories = groupedQuery.data ?? [];

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groupedCategories;
    return groupedCategories.filter((g) =>
      `${g.category_code ?? ""} ${g.category_name ?? ""}`.toLowerCase().includes(q)
    );
  }, [groupedCategories, search]);

  return (
    <main className="relative flex-1 overflow-hidden">
      {/* Ambient background decorations */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-500/10" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-tertiary-400/10 blur-3xl dark:bg-tertiary-500/10" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-300/5 blur-3xl dark:bg-primary-600/10" />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-90px)] w-full max-w-6xl flex-col px-4 py-2 sm:px-6 sm:py-12">
        <div className="flex-1">
          {/* Story Feed Section */}
          <section className="mt-8 sm:mt-0">
            <StoryFeed />
          </section>

          {/* Hero Banner Section */}
          <section className="mt-10">
            {heroQuery.isLoading ? (
              <HeroBannerSkeleton />
            ) : heroListings.length > 0 ? (
              <HeroBanner listings={heroListings} />
            ) : null}
          </section>

          {/* Categories Sections */}
          <div className="mb-25 md:mb-5">
            {(groupedQuery.isLoading || isLocating) ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mt-14 animate-pulse">
                  <div className="h-8 w-48 rounded bg-secondary-100 dark:bg-secondary-800" />
                  <div className="mt-6 flex gap-4 overflow-hidden">
                    {Array.from({ length: 3 }).map((_, j) => <NearbyListingSkeleton key={j} />)}
                  </div>
                </div>
              ))
            ) : filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <CategoryPropertiesSection
                  key={group.category_id}
                  title={tPropertyCategory(group.category_code || group.category_name)}
                  categoryId={group.category_id}
                  listings={group.listings}
                  isLoading={groupedQuery.isFetching}
                />
              ))
            ) : (
              <div className="mt-14 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-card/50 py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-800">
                  <Sparkles className="h-5 w-5 text-text-tertiary" />
                </div>
                <p className="text-sm text-text-secondary">
                  No categories match your search.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Footer */}
        <footer className="hidden md:block relative mt-5 mb-20 sm:mb-0">
          {/* Top gradient divider */}
          <div className="h-px w-full bg-linear-to-r from-transparent via-border to-transparent" />

          <div className="pt-8 text-sm text-text-tertiary">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-primary-500 to-tertiary-500 text-white shadow-sm">
                  <Image src={logoSingleN} className="p-1.5" alt="logo"/>
                </div>
                <span>© {new Date().getFullYear()} Nhyvas</span>
              </div>

              <div className="flex items-center gap-4">
                <Link
                  href="/terms"
                  className="font-medium transition-colors hover:text-text-primary"
                >
                  {t("common.terms")}
                </Link>
                <Link
                  href="/privacy"
                  className="font-medium transition-colors hover:text-text-primary"
                >
                  {t("common.privacy")}
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Filters Sheet */}
      <div className="md:hidden">
        <MobileBottomSheet
          open={filtersOpen}
          title={t("explore.refine_search")}
          description={t("explore.apply_filters_desc")}
          onClose={() => setFiltersOpen(false)}
        >
          <ExploreFiltersPanel
            value={draftFilters}
            onChange={setDraftFilters}
            onApply={() => {
              const query: Record<string, string> = {};
              if (draftFilters.categoryIds.length) query.categories = draftFilters.categoryIds.join(",");
              if (draftFilters.subcategoryIds.length) query.subcategories = draftFilters.subcategoryIds.join(",");
              if (draftFilters.minPrice.trim()) query.minPrice = draftFilters.minPrice.trim();
              if (draftFilters.maxPrice.trim()) query.maxPrice = draftFilters.maxPrice.trim();
              if (draftFilters.amenityIds.length) query.amenities = draftFilters.amenityIds.join(",");
              if (draftFilters.locationNode) query.location = JSON.stringify(draftFilters.locationNode);
              const params = new URLSearchParams(query).toString();
              router.push(params ? `/explore?${params}` : "/explore");
              setFiltersOpen(false);
            }}
            onReset={(reset) => setDraftFilters(reset)}
          />
        </MobileBottomSheet>
      </div>
    </main>
  );
}

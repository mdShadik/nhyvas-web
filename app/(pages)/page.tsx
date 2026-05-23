"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, TrendingUp, MapPin, ArrowRight } from "lucide-react";
import { exploreService } from "@/services/apiService";
import { noImagePlaceholder } from "../../assets";
import { formatPrice } from "@/lib/formatPrice";
import { ExploreFiltersPanel } from "@/components/explore/ExploreFiltersPanel";
import { EMPTY_FILTERS, type FilterState } from "@/components/explore/exploreFilters";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { useTranslation } from "react-i18next";
import { tPropertyCategory, tPropertyCategoryDescription } from "@/i18n/masterData";
import { StoryFeed } from "@/components/stories/StoryFeed";

type Category = Awaited<ReturnType<typeof exploreService.getHomeCategories>>[number];
type HeroListing = Awaited<ReturnType<typeof exploreService.getHomeHeroListings>>[number];

function CategoryCard({ category }: { category: Category }) {
  const { t } = useTranslation();
  const rawName = category.code ?? category.name ?? "";
  const name = tPropertyCategory(rawName) || "Category";
  const desc = tPropertyCategoryDescription(rawName, category.description || t("home.explore_listings"));

  return (
    <Link
      href={{
        pathname: "/explore",
        query: category.code ? { category: category.code } : undefined,
      }}
      className="group relative isolate overflow-hidden rounded-2xl border border-border bg-bg-card/40 p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-primary-400/50 hover:shadow-xl hover:shadow-primary-500/20 dark:hover:border-primary-500/40 dark:hover:shadow-primary-500/10"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-primary-400/80 via-primary-500/20 to-transparent blur-3xl transition-transform duration-700 group-hover:scale-125 dark:from-primary-500/25 dark:via-primary-600/15" />
        <div className="absolute -bottom-20 -right-10 h-52 w-52 rounded-full bg-gradient-to-tl from-tertiary-400/30 via-tertiary-500/20 to-transparent blur-3xl transition-transform duration-700 group-hover:scale-125 dark:from-tertiary-500/25 dark:via-tertiary-600/15" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03] transition-opacity duration-500 group-hover:opacity-[0.06] dark:opacity-[0.05] dark:group-hover:opacity-[0.08]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />

      <div className="pointer-events-none absolute right-4 top-4 h-2 w-2 rounded-full bg-tertiary-400 opacity-0 shadow-lg shadow-tertiary-400/50 transition-all duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute right-8 top-8 h-1 w-1 rounded-full bg-primary-400 opacity-0 shadow-lg shadow-primary-400/50 transition-all delay-100 duration-500 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary-200/60 bg-primary-50/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-700 backdrop-blur-sm dark:border-primary-500/20 dark:bg-primary-900/30 dark:text-primary-300">
            <span className="h-1.5 w-1.5 rounded-full bg-tertiary-500 shadow-sm shadow-tertiary-500/50" />
            {t("common.category") || "Category"}
          </div>

          <h3 className="bg-gradient-to-br from-text-primary to-text-primary bg-clip-text text-lg font-bold leading-tight text-transparent transition-all duration-500 group-hover:from-primary-600 group-hover:to-tertiary-600 dark:group-hover:from-primary-400 dark:group-hover:to-tertiary-400">
            {name}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-text-secondary">
            {desc}
          </p>

          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400">
            <span className="transition-transform duration-300 group-hover:translate-x-0.5">
              {t("common.view")}
            </span>
            <svg
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>

        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500 to-tertiary-500 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-60" />

          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 shadow-lg shadow-primary-500/30 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 dark:from-primary-500 dark:via-primary-600 dark:to-primary-800 dark:shadow-primary-500/20">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/20 to-white/0" />

            <svg
              className="relative h-7 w-7 text-white drop-shadow-md"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>

          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-bg-card bg-tertiary-500 shadow-md transition-transform duration-500 group-hover:scale-125" />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </Link>
  );
}

function CategorySkeleton() {
  return (
    <div className="relative h-[160px] overflow-hidden rounded-2xl border border-border bg-bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-4 w-20 rounded-full bg-secondary-200 dark:bg-secondary-700" />
          <div className="h-5 w-32 rounded-md bg-secondary-200 dark:bg-secondary-700" />
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded-md bg-secondary-100 dark:bg-secondary-800" />
            <div className="h-3 w-3/4 rounded-md bg-secondary-100 dark:bg-secondary-800" />
          </div>
          <div className="h-3 w-16 rounded-md bg-secondary-200 dark:bg-secondary-700" />
        </div>
        <div className="h-14 w-14 shrink-0 rounded-2xl bg-secondary-200 dark:bg-secondary-700" />
      </div>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5" />
    </div>
  );
}

function HeroBannerSkeleton() {
  return (
    <div className="relative animate-pulse overflow-hidden rounded-[28px] border border-border bg-secondary-100 dark:bg-secondary-800">
      <div className="h-95 w-full bg-secondary-200/70 dark:bg-secondary-700/50 sm:h-110" />
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

function HeroBanner({ listings }: { listings: HeroListing[] }) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || listings.length <= 1) return;

    const timer = setInterval(() => {
      if (currentIndex < listings.length - 1) {
        setDirection(1);
        setCurrentIndex((prev) => prev + 1);
      } else {
        setDirection(-1);
        setCurrentIndex(0);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, listings.length]);

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
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-transparent to-tertiary-900/20 pointer-events-none mix-blend-overlay" />

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
              <div className="relative overflow-hidden rounded-full w-fit bg-gradient-to-r from-primary-500 to-tertiary-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-primary-500/30 backdrop-blur-md">
                <div className="absolute inset-0 overflow-hidden rounded-full">
                  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>
                <span className="relative z-10 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  {t("home.badge_featured")}
                </span>
              </div>

              <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" />
                <span>Trending</span>
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
                <div className="text-2xl font-bold text-white sm:text-4xl bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  {formatPrice(listing.price, listing.currency_code)}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={{ pathname: "/property", query: { id: listing.id } }}
                  className="group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-tertiary-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/40 transition-all hover:shadow-xl hover:shadow-primary-500/50 hover:-translate-y-0.5 active:translate-y-0 pointer-events-auto cursor-pointer"
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
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
                  ? "w-8 bg-gradient-to-r from-primary-400 to-tertiary-400"
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

  const categoriesQuery = useQuery({
    queryKey: ["home", "categories"],
    queryFn: () => exploreService.getHomeCategories(12),
  });

  const heroQuery = useQuery({
    queryKey: ["home", "hero"],
    queryFn: () => exploreService.getHomeHeroListings(8),
  });

  const categories = categoriesQuery.data ?? [];
  const heroListings = heroQuery.data ?? [];

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) =>
      `${c.code ?? ""} ${c.name ?? ""}`.toLowerCase().includes(q)
    );
  }, [categories, search]);

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

          {/* Categories Section */}
          <section className={`${heroListings.length > 0 ? "mt-14" : "mt-10"} mb-25 md:mb-5`}>
            {/* Section header with decorative elements */}
            <div className="relative">
              <div className="flex items-end justify-between gap-4">
                <div className="relative">
                  {/* Decorative line accent */}
                  <div className="absolute -left-4 top-2 hidden h-8 w-1 rounded-full bg-gradient-to-b from-primary-500 to-tertiary-500 sm:block" />

                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-primary-200/60 bg-primary-50/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-700 backdrop-blur-sm dark:border-primary-500/20 dark:bg-primary-900/30 dark:text-primary-300">
                      <Sparkles className="h-3 w-3" />
                      {t("home.browse_categories")}
                    </div>
                  </div>

                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                    {t("home.browse_categories")}
                  </h2>

                  <p className="mt-1.5 text-sm text-text-secondary">
                    {t("home.start_with_what_you_need")}
                  </p>
                </div>

                <Link
                  href="/explore"
                  className="group/link inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-card px-4 py-2 text-sm font-semibold text-primary-600 shadow-sm transition-all hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5 dark:text-primary-400 dark:hover:border-primary-500/50"
                >
                  {t("common.view_all")}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoriesQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <CategorySkeleton key={i} />)
              ) : filteredCategories.length ? (
                filteredCategories.map((c) => <CategoryCard key={c.id} category={c} />)
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-card/50 py-12 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-800">
                    <Sparkles className="h-5 w-5 text-text-tertiary" />
                  </div>
                  <p className="text-sm text-text-secondary">
                    No categories match your search.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Enhanced Footer */}
        <footer className="hidden md:block relative mt-5 mb-20 sm:mb-0">
          {/* Top gradient divider */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="pt-8 text-sm text-text-tertiary">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-tertiary-500 text-white shadow-sm">
                  <span className="text-xs font-bold">N</span>
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
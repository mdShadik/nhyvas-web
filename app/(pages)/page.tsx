"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
      className="group relative overflow-hidden rounded-2xl border border-border dark:bg-linear-to-tl bg-linear-to-br from-white via-white dark:from-bg-page dark:via-primary-900/10 dark:to-tertiary-900/40 to-tertiary-50 px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base font-semibold text-text-primary">{name}</div>
          <div className="mt-1 max-h-10 overflow-hidden text-sm text-text-secondary">
            {desc}
          </div>
        </div>

        <div className="shrink-0 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700 transition group-hover:bg-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:group-hover:bg-primary-900/60">
          {t("common.view")}
        </div>
      </div>

      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary-400/10 blur-2xl dark:bg-primary-400/15" />
    </Link>
  );
}

function CategorySkeleton() {
  return (
    <div className="h-23 animate-pulse rounded-2xl border border-border bg-secondary-100 dark:bg-secondary-800" />
  );
}

function HeroBannerSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[28px] border border-border bg-secondary-100 dark:bg-secondary-800">
      <div className="h-95 w-full bg-secondary-200/70 dark:bg-secondary-700/50 sm:h-110" />
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
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

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
      className="group relative min-h-95 overflow-hidden rounded-[28px] border border-border shadow-sm sm:min-h-110 bg-secondary-100 dark:bg-secondary-800"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      // Add touch handlers for mobile to pause slider
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
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          className="absolute inset-0"
        >
          <Image
            src={listing.thumbnail_url || noImagePlaceholder}
            alt={listing.property_title}
            fill
            priority
            className="object-cover pointer-events-none"
            sizes="100vw"
          />

          <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/50 to-black/20 pointer-events-none" />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 flex h-full flex-col justify-between p-3 sm:p-10 pointer-events-none">
            <div className="rounded-full w-fit bg-linear-to-r from-primary-500 to-tertiary-500 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
              {t("home.badge_featured")}
            </div>

            <div className="max-w-2xl mt-auto">
              <p className="mb-3 text-sm font-medium text-white/80">
                {t("home.prime_listing")}
              </p>

              <h1 className="text-3xl font-semibold leading-tight text-white sm:text-5xl">
                {listing.property_title}
              </h1>

              <p className="mt-3 text-sm text-white/80 sm:text-base">
                {listing.location_text}
              </p>

              <div className="mt-5 text-2xl font-bold text-white sm:text-3xl">
                {formatPrice(listing.price, listing.currency_code)}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={{ pathname: "/property", query: { id: listing.id } }}
                  className="inline-flex items-center justify-center rounded-2xl hover:bg-linear-to-tl bg-linear-to-br from-primary-600 via-primary-500 to-tertiary-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-500 active:bg-primary-700 pointer-events-auto cursor-pointer"
                >
                  {t("home.view_property")}
                </Link>

                <Link
                  href="/explore"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15 pointer-events-auto cursor-pointer"
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
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50 opacity-0 group-hover:opacity-100"
          onClick={() => paginate(-1)}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {currentIndex < listings.length - 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50 opacity-0 group-hover:opacity-100"
          onClick={() => paginate(1)}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {listings.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {listings.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`h-2 rounded-full transition-all ${idx === currentIndex ? "w-6 bg-primary-500" : "w-2 bg-white/50 hover:bg-white/80"
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
  const [search, setSearch] = useState("");
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
  const featuredListing = heroListings[0];

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;

    return categories.filter((c) =>
      `${c.code ?? ""} ${c.name ?? ""}`.toLowerCase().includes(q)
    );
  }, [categories, search]);

  return (
    <main className={`flex-1`}>
      <div className="mx-auto w-full max-w-6xl px-4 py-2 sm:px-6 sm:py-12">
        <section className="mt-8 sm:mt-0">
          <StoryFeed />
        </section>

        <section className="mt-10">
          {heroQuery.isLoading ? (
            <HeroBannerSkeleton />
          ) : heroListings.length > 0 ? (
            <HeroBanner listings={heroListings} />
          ) : (
            null
          )}
        </section>

        {/* <section className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
              {t("home.find_next_place")}
            </h2>

            <p className="mt-3 max-w-prose text-base text-text-secondary">
              {t("home.browse_verified")}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <label className="sr-only" htmlFor="search">
                  {t("common.search")}
                </label>
                <input
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("home.search_categories")}
                  className="w-full rounded-2xl border border-border bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-placeholder outline-none ring-primary-500/20 transition focus:border-primary-400 focus:ring-4"
                />
              </div>

              <Link
                href={{
                  pathname: "/explore",
                  query: search.trim() ? { q: search.trim() } : undefined,
                }}
                className="inline-flex items-center justify-center rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-500 active:bg-primary-700"
              >
                {t("common.search")}
              </Link>

              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex items-center justify-center rounded-2xl border border-border bg-bg-card px-5 py-3 text-sm font-semibold text-text-primary shadow-sm transition hover:bg-secondary-100 dark:hover:bg-secondary-800 md:hidden"
              >
                {t("common.filters")}
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-xs text-text-tertiary">
              {["2bhk at bhaktapur", "1bhk at putalisadak", "4bhk at baneshwor"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary-200/60 px-3 py-1 dark:bg-secondary-700/50"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-bg-card p-6 shadow-sm">
            <div className="text-sm font-semibold text-text-primary">
              {t("home.why_nhyvas")}
            </div>
            <div className="mt-2 text-sm text-text-secondary">
              {t("home.why_nhyvas_desc")}
            </div>
          </div>
        </section> */}

        <section className={`${heroListings.length > 0 ? "mt-12" : ""}`}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-text-primary">
                {t("home.browse_categories")}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {t("home.start_with_what_you_need")}
              </p>
            </div>

            <Link
              href="/explore"
              className="text-sm font-semibold text-primary-600 transition hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {t("common.view_all")}
            </Link>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoriesQuery.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <CategorySkeleton key={i} />)
            ) : filteredCategories.length ? (
              filteredCategories.map((c) => (
                <CategoryCard key={c.id} category={c} />
              ))
            ) : (
              <div className="text-sm text-text-secondary">
                No categories match your search.
              </div>
            )}
          </div>
        </section>

        <footer className="mt-14 mb-18 sm:mb-0 border-t border-border pt-8 text-sm text-text-tertiary">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} Nhyvas</div>

            <div className="flex gap-4">
              <Link href="/help" className="transition hover:text-text-primary">
                {t("common.help")}
              </Link>
              <Link href="/terms" className="transition hover:text-text-primary">
                {t("common.terms")}
              </Link>
            </div>
          </div>
        </footer>
      </div>

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
              if (draftFilters.categoryCode) query.category = draftFilters.categoryCode;
              if (draftFilters.subcategoryId) query.subcategoryId = draftFilters.subcategoryId;
              if (draftFilters.minPrice.trim()) query.minPrice = draftFilters.minPrice.trim();
              if (draftFilters.maxPrice.trim()) query.maxPrice = draftFilters.maxPrice.trim();
              if (draftFilters.amenityNames.length) query.amenities = draftFilters.amenityNames.join(",");
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

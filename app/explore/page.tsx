"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { exploreService, ExploreListing } from "@/services/apiService/explore";
import { MapPin, Heart, Search, SlidersHorizontal } from "lucide-react";
import { formatPrice } from "../page";
import { logoSingleN, noImagePlaceholder } from "../../assets";
import { useQuery } from "@tanstack/react-query";
import { ExploreFiltersPanel } from "@/components/explore/ExploreFiltersPanel";
import { EMPTY_FILTERS, type FilterState } from "@/components/explore/exploreFilters";
import { useSearchParams } from "next/navigation";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { useTranslation } from "react-i18next";
import { tPropertyCategory, tPropertySubcategory } from "@/i18n/masterData";

export function ListingCard({ listing }: { listing: ExploreListing }) {
  const { t } = useTranslation();
  const thumbnailUrl = listing.thumbnail_url || noImagePlaceholder;

  return (
    <Link
      href={{ pathname: "/property", query: { id: listing.id } }}
      className="group block"
    >
      <article className="overflow-hidden rounded-2xl border border-border bg-page-bg-from shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:shadow-none">
        <div className="flex flex-col lg:flex-row">
          {/* Image */}
          <div className="relative h-56 w-full dark:bg-secondary-500 shrink-0 lg:h-auto lg md:w-[320px] lg:w-90">
            <Image
              alt={listing.property_title}
              src={thumbnailUrl}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 360px"
            />

            <div className="pointer-events-none absolute left-3 top-3 opacity-20">
              <Image
                src={logoSingleN}
                alt="Nhyvas watermark"
                width={32}
                height={32}
              />
            </div>

            {listing.is_featured && (
              <div className="absolute left-3 bottom-3 rounded-full bg-(--accent) px-3 py-1 text-xs font-semibold tracking-wide text-white shadow-sm">
                {t("explore.featured")}
              </div>
            )}

            <button
              type="button"
              aria-label="Save property"
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/55"
            >
              <Heart className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="line-clamp-1 text-base font-bold text-text-primary sm:text-lg">
                    {listing.property_title}
                  </h3>

                  <div className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                    <MapPin className="h-4 w-4 shrink-0 text-accent" />
                    <span className="line-clamp-1">{listing.location_text}</span>
                  </div>
                </div>

                <div className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] px-3 py-1 text-xs font-medium text-accent">
                  {tPropertyCategory(listing.property_category)}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-text-tertiary">
                {listing.subcategory && (
                  <span className="rounded-full bg-secondary-100 px-2.5 py-1 dark:bg-secondary-700">
                    {tPropertySubcategory(listing.subcategory)}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between gap-4 border-t border-border pt-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-tertiary">
                  {t("explore.price_label")}
                </p>
                <div className="text-xl font-extrabold text-accent">
                  {formatPrice(listing.price, listing.currency_code)}
                </div>
              </div>

              <div className="rounded-xl bg-secondary-100 px-4 py-2 text-sm font-medium text-text-primary transition group-hover:bg-primary-100 dark:bg-secondary-700 dark:group-hover:bg-secondary-600">
                {t("explore.view_details")}
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function ExplorePage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const didInitFromUrlRef = useRef(false);
  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS });
  const [draftFilters, setDraftFilters] = useState<FilterState>({ ...EMPTY_FILTERS });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (didInitFromUrlRef.current) return;
    didInitFromUrlRef.current = true;

    const categoryCode = searchParams.get("categoryCode") || searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const subcategoryId = searchParams.get("subcategoryId");
    const amenityNames = searchParams.get("amenities");
    const locationRaw = searchParams.get("location");

    let locationNode: FilterState["locationNode"] = null;
    if (locationRaw) {
      try {
        const parsed = JSON.parse(locationRaw);
        if (parsed && typeof parsed === "object" && typeof parsed.label === "string") {
          locationNode = parsed;
        }
      } catch {}
    }

    const next: FilterState = {
      ...EMPTY_FILTERS,
      categoryCode: categoryCode?.trim() ? categoryCode.trim() : null,
      subcategoryId: subcategoryId?.trim() ? subcategoryId.trim() : null,
      locationNode,
      minPrice: minPrice?.trim() ? minPrice.trim() : "",
      maxPrice: maxPrice?.trim() ? maxPrice.trim() : "",
      amenityNames: amenityNames?.trim()
        ? amenityNames
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    };

    setFilters(next);
    setDraftFilters(next);
  }, [searchParams]);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: false, timeout: 6000 }
    );
  }, []);

  const categoriesQuery = useQuery({
    queryKey: ["explore", "categories"],
    queryFn: () => exploreService.getHomeCategories(200),
  });

  const appliedSubcategoriesQuery = useQuery({
    queryKey: ["explore", "subcategories-applied", filters.categoryCode],
    queryFn: () => exploreService.getSubcategoriesByCategoryCode(filters.categoryCode!),
    enabled: Boolean(filters.categoryCode),
  });

  const selectedCategory =
    (categoriesQuery.data ?? []).find((row) => row.code === filters.categoryCode) ?? null;
  const selectedSubcategory =
    (appliedSubcategoriesQuery.data ?? []).find((row) => row.id === filters.subcategoryId) ?? null;

  const listingFilters = useMemo(() => {
    const minPrice = filters.minPrice.trim() ? Number(filters.minPrice) : null;
    const maxPrice = filters.maxPrice.trim() ? Number(filters.maxPrice) : null;

    const location = filters.locationNode;
    const hasLocationPoint =
      Number.isFinite(location?.latitude as number) && Number.isFinite(location?.longitude as number);

    return {
      category: selectedCategory?.name ?? null,
      subcategory: selectedSubcategory?.name ?? null,
      stateId: hasLocationPoint ? null : (location?.state_id ?? null),
      districtId: hasLocationPoint ? null : (location?.district_id ?? null),
      municipalityId: hasLocationPoint ? null : (location?.municipality_id ?? null),
      wardId: hasLocationPoint ? null : (location?.ward_id ?? null),
      minPrice: Number.isFinite(minPrice as number) ? minPrice : null,
      maxPrice: Number.isFinite(maxPrice as number) ? maxPrice : null,
      amenityTags: filters.amenityNames,
      filterLat: hasLocationPoint ? (location?.latitude ?? null) : null,
      filterLng: hasLocationPoint ? (location?.longitude ?? null) : null,
      filterRadiusKm: hasLocationPoint ? 2 : null,
      userLat: userLocation?.latitude ?? null,
      userLng: userLocation?.longitude ?? null,
      userRadiusKm: 15,
      limit: 120,
      offset: 0,
    };
  }, [
    filters,
    selectedCategory?.name,
    selectedSubcategory?.name,
    userLocation?.latitude,
    userLocation?.longitude,
  ]);

  const listingsQuery = useQuery({
    queryKey: ["explore", "recommended-listings", listingFilters],
    queryFn: () => exploreService.getRecommendedListings(listingFilters),
  });

  const listings = listingsQuery.data ?? [];
  const loading = listingsQuery.isLoading || listingsQuery.isFetching;

  return (
    <div className={`flex min-h-screen flex-col`}>

      <main className="flex flex-1 gap-6 p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto w-full">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">{t("explore.title")}</h1>
              <p className="mt-1 text-text-secondary">
                {t("explore.subtitle", { count: listings.length })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDraftFilters(filters);
                setFiltersOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-(--surface) px-4 py-3 text-sm font-semibold text-text-primary shadow-sm transition hover:bg-(--surface)/80 md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4 text-accent" />
              {t("common.filters")}
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-85 md:h-75 lg:h-50 rounded-2xl bg-(--border)/50 animate-pulse" />
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="gap-6 flex flex-col">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-(--card-bg) p-12 text-center">
              <Search className="mb-4 h-12 w-12 text-muted" />
              <h3 className="text-lg font-semibold text-text-primary">{t("explore.no_properties")}</h3>
              <p className="mt-2 max-w-sm text-text-secondary">
                {t("explore.no_properties_desc")}
              </p>
            </div>
          )}
        </div>

        {/* Right Sidebar - Filters */}
        <aside className="max-w-100 mt-21 shrink-0 hidden md:block">
          <div className="sticky top-6 rounded-3xl border border-border bg-page-bg-from p-6 shadow-sm">
            {/* <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-3">{t("common.filters")}</h2> */}
            <ExploreFiltersPanel
              value={draftFilters}
              onChange={setDraftFilters}
              onApply={() => setFilters(draftFilters)}
              onReset={(reset) => {
                setDraftFilters(reset);
                setFilters(reset);
              }}
            />
          </div>
        </aside>
      </main>

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
              setFilters(draftFilters);
              setFiltersOpen(false);
            }}
            onReset={(reset) => {
              setDraftFilters(reset);
              setFilters(reset);
            }}
          />
        </MobileBottomSheet>
      </div>
    </div>
  );
}

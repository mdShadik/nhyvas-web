"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { exploreService } from "@/services/apiService/explore";
import { SlidersHorizontal, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ExploreFiltersPanel } from "@/components/explore/ExploreFiltersPanel";
import { EMPTY_FILTERS, type FilterState } from "@/components/explore/exploreFilters";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { useTranslation } from "react-i18next";
import { ListingCard } from "@/components/explore/ListingCard";
import { SearchParamsProps } from "@/app/(pages)/explore/page";

interface Props {
  searchParams: SearchParamsProps;
}

export default function ExplorePage({ searchParams }: Props) {
  const { t } = useTranslation();
  const didInitFromUrlRef = useRef(false);
  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS });
  const [draftFilters, setDraftFilters] = useState<FilterState>({ ...EMPTY_FILTERS });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (didInitFromUrlRef.current) return;
    didInitFromUrlRef.current = true;

    const categoryCode = searchParams.categoryCode || searchParams.category;
    const minPrice = searchParams.minPrice;
    const maxPrice = searchParams.maxPrice;
    const subcategoryId = searchParams.subcategoryId;
    const amenityNames = searchParams.amenities;
    const locationRaw = searchParams.location;

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
          <div className="mb-6 flex items-center justify-end sm:justify-between">
            <div className="hidden sm:block">
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

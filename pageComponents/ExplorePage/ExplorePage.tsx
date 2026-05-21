"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { exploreService } from "@/services/apiService/explore";
import { profileService } from "@/services/apiService/profile";
import { SlidersHorizontal, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ExploreFiltersPanel } from "@/components/explore/ExploreFiltersPanel";
import { EMPTY_FILTERS, type FilterState } from "@/components/explore/exploreFilters";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { useTranslation } from "react-i18next";
import { ListingCard } from "@/components/explore/ListingCard";
import { SearchParamsProps } from "@/app/(pages)/explore/page";
import { AiSearch } from "@/components/AiSearch/Aisearch";

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

  const bootstrapQuery = useQuery({
    queryKey: ["auth", "bootstrap"],
    queryFn: () => profileService.getBootstrap(),
  });

  useEffect(() => {
    if (didInitFromUrlRef.current) return;
    if (bootstrapQuery.isLoading) return;

    didInitFromUrlRef.current = true;

    const categoryCode = searchParams.categoryCode || searchParams.category;
    const minPrice = searchParams.minPrice;
    const maxPrice = searchParams.maxPrice;
    const subcategoryId = searchParams.subcategoryId;
    const amenityIdsRaw = searchParams.amenities;
    const locationRaw = searchParams.location;

    const hasUrlFilters = Boolean(
      categoryCode || minPrice || maxPrice || subcategoryId || amenityIdsRaw || locationRaw
    );

    let locationNode: FilterState["locationNode"] = null;
    if (locationRaw) {
      try {
        const parsed = JSON.parse(locationRaw);
        if (parsed && typeof parsed === "object" && typeof parsed.label === "string") {
          locationNode = parsed;
        }
      } catch {}
    }

    const prefs = bootstrapQuery.data?.preferences;

    const next: FilterState = {
      ...EMPTY_FILTERS,
      categoryCode: (categoryCode?.trim() || (!hasUrlFilters && prefs?.category_code)) ? (categoryCode?.trim() || prefs?.category_code || null) : null,
      subcategoryId: subcategoryId?.trim() ? subcategoryId.trim() : null,
      locationNode,
      minPrice: (minPrice?.trim() || (!hasUrlFilters && prefs?.min_price !== null)) ? (minPrice?.trim() || String(prefs?.min_price ?? "")) : "",
      maxPrice: (maxPrice?.trim() || (!hasUrlFilters && prefs?.max_price !== null)) ? (maxPrice?.trim() || String(prefs?.max_price ?? "")) : "",
      amenityIds: amenityIdsRaw?.trim()
        ? amenityIdsRaw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : (!hasUrlFilters && prefs?.preferred_amenities?.length)
          ? prefs.preferred_amenities
          : [],
    };

    setFilters(next);
    setDraftFilters(next);
  }, [searchParams, bootstrapQuery.isLoading, bootstrapQuery.data]);

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

    const isFiltered = Boolean(
      filters.categoryCode ||
      filters.subcategoryId ||
      (filters.minPrice && filters.minPrice.trim()) ||
      (filters.maxPrice && filters.maxPrice.trim()) ||
      (filters.amenityIds && filters.amenityIds.length > 0) ||
      filters.locationNode
    );

    return {
      category: selectedCategory?.name ?? null,
      subcategory: selectedSubcategory?.name ?? null,
      stateId: hasLocationPoint ? null : (location?.state_id ?? null),
      districtId: hasLocationPoint ? null : (location?.district_id ?? null),
      municipalityId: hasLocationPoint ? null : (location?.municipality_id ?? null),
      wardId: hasLocationPoint ? null : (location?.ward_id ?? null),
      minPrice: Number.isFinite(minPrice as number) ? minPrice : null,
      maxPrice: Number.isFinite(maxPrice as number) ? maxPrice : null,
      amenityTags: filters.amenityIds,
      filterLat: hasLocationPoint ? (location?.latitude ?? null) : null,
      filterLng: hasLocationPoint ? (location?.longitude ?? null) : null,
      filterRadiusKm: hasLocationPoint ? 2 : null,
      userLat: !isFiltered ? (userLocation?.latitude ?? null) : null,
      userLng: !isFiltered ? (userLocation?.longitude ?? null) : null,
      userRadiusKm: !isFiltered ? 5 : null,
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

  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    // Your API call
    const res = await fetch(`/api/ai-search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.results);
    setIsSearching(false);
  };


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

      <AiSearch
        onSearch={handleSearch}
        isSearching={isSearching}
        buttonLabel="AI Search"
        buttonPosition="bottom-right"
        showMic
        onMicPress={() => console.log("Start voice input")}
        minQueryLength={2}
        placeholders={[
          "Search properties with AI…",
          "Try: 3 bedroom apartment downtown",
          "Ask: best neighborhoods for families",
          "Find: villas under $500k with pool",
        ]}
        suggestions={[
          { id: "1", label: "Apartments near me", icon: "trending" },
          { id: "2", label: "Pet-friendly rentals", icon: "suggestion" },
          { id: "3", label: "New listings this week", icon: "trending" },
          { id: "4", label: "Luxury penthouses", icon: "suggestion" },
        ]}
      >
        {/* Results render here */}
        {results.length > 0 && (
          <div className="flex flex-col gap-2 pt-2">
            {results.map((r, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-bg-input p-3 text-sm text-text-primary"
              >
                {r}
              </div>
            ))}
          </div>
        )}
      </AiSearch>
    </div>
  );
}

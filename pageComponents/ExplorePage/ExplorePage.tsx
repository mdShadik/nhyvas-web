"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExploreListing, exploreService, type LocationSearchNode } from "@/services/apiService/explore";
import { profileService } from "@/services/apiService/profile";
import { galliMapService } from "@/services/galliMap";
import { SlidersHorizontal, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ExploreFiltersPanel } from "@/components/explore/ExploreFiltersPanel";
import { EMPTY_FILTERS, type FilterState } from "@/components/explore/exploreFilters";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { useTranslation } from "react-i18next";
import { ListingCard } from "@/components/explore/ListingCard";
import { SearchParamsProps } from "@/app/(pages)/explore/page";
import { AiSearch } from "@/components/AiSearch/Aisearch";
import { AnalyzedQuery, AnalyzedSubcategory } from "@/lib/ai/queryAnalyzer";
import { LoginModal } from "@/components/auth/LoginModal";

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

  const isLoggedIn = !!bootstrapQuery.data?.profile;

  useEffect(() => {
    if (didInitFromUrlRef.current) return;
    if (bootstrapQuery.isLoading) return;

    didInitFromUrlRef.current = true;

    const categoryIdsRaw = searchParams.categoryId || searchParams.category || searchParams.categories;
    const minPrice = searchParams.minPrice;
    const maxPrice = searchParams.maxPrice;
    const subcategoryIdsRaw = searchParams.subcategoryId || searchParams.subcategories;
    const amenityIdsRaw = searchParams.amenities;
    const locationRaw = searchParams.location;

    const hasUrlFilters = Boolean(
      categoryIdsRaw || minPrice || maxPrice || subcategoryIdsRaw || amenityIdsRaw || locationRaw
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

    const categoryIds = categoryIdsRaw?.trim()
      ? categoryIdsRaw.split(",").map((s:any) => s.trim()).filter(Boolean)
      : (!hasUrlFilters && prefs?.category_id)
        ? [prefs.category_id]
        : [];

    const subcategoryIds = subcategoryIdsRaw?.trim()
      ? subcategoryIdsRaw.split(",").map((s:any) => s.trim()).filter(Boolean)
      : [];

    const next: FilterState = {
      ...EMPTY_FILTERS,
      categoryIds,
      subcategoryIds,
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
    queryKey: ["explore", "subcategories-applied", filters.categoryIds],
    queryFn: () => exploreService.getSubcategoriesByCategoryIds(filters.categoryIds),
    enabled: filters.categoryIds.length > 0,
  });

  const listingFilters = useMemo(() => {
    const minPrice = filters.minPrice.trim() ? Number(filters.minPrice) : null;
    const maxPrice = filters.maxPrice.trim() ? Number(filters.maxPrice) : null;

    const location = filters.locationNode;
    const hasLocationPoint =
      Number.isFinite(location?.latitude as number) && Number.isFinite(location?.longitude as number);

    const isFiltered = Boolean(
      filters.categoryIds.length > 0 ||
      filters.subcategoryIds.length > 0 ||
      (filters.minPrice && filters.minPrice.trim()) ||
      (filters.maxPrice && filters.maxPrice.trim()) ||
      (filters.amenityIds && filters.amenityIds.length > 0) ||
      filters.locationNode
    );

    const useUserLocation = filters.nearMe || !isFiltered;

    return {
      categoryIds: filters.categoryIds,
      subcategoryIds: filters.subcategoryIds,
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
      userLat: useUserLocation ? (userLocation?.latitude ?? null) : null,
      userLng: useUserLocation ? (userLocation?.longitude ?? null) : null,
      userRadiusKm: useUserLocation ? 5 : null,
      limit: 120,
      offset: 0,
    };
  }, [
    filters,
    userLocation?.latitude,
    userLocation?.longitude,
  ]);

  const listingsQuery = useQuery({
    queryKey: ["explore", "recommended-listings", listingFilters],
    queryFn: () => exploreService.getRecommendedListings(listingFilters),
  });

  const listings = listingsQuery.data ?? [];
  const loading = listingsQuery.isLoading || listingsQuery.isFetching;

  const [aiSearchOpen, setAiSearchOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [aiResponse, setAiResponse] = useState<AnalyzedQuery | null>(null);
  const [aiListings, setAiListings] = useState<ExploreListing[] | null>(null);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const { analysis, listings } = await exploreService.aiSearch(
        query,
        userLocation?.latitude,
        userLocation?.longitude
      );

      setAiResponse(analysis);
      setAiListings(listings);

      if (analysis) {
        let locationNode: FilterState["locationNode"] = null;
        if (analysis.location) {
          try {
            const searchQuery = analysis.isWardSearch && analysis.wardNumber
              ? `${analysis.location} ward ${analysis.wardNumber}`
              : analysis.location;

            // Default to Kathmandu if user location is not available
            const lat = userLocation?.latitude ?? 27.7172;
            const lng = userLocation?.longitude ?? 85.3240;

            const galliData = await galliMapService.searchWithCurrentLocation(searchQuery, lat, lng);
            const features = galliData?.features || [];

            if (features.length > 0) {
              const f = features[0];
              if (f.geometry && f.geometry.coordinates) {
                locationNode = {
                  id: `galli-${f.geometry.coordinates[1]}-${f.geometry.coordinates[0]}`,
                  label: f.properties.searchedItem || searchQuery,
                  level: "ward" as const, // Satisfies type constraint
                  state_id: null,
                  district_id: null,
                  municipality_id: null,
                  ward_id: null,
                  latitude: f.geometry.coordinates[1], // [longitude, latitude]
                  longitude: f.geometry.coordinates[0],
                };
              }
            }
          } catch (err) {
            console.error("Location resolution failed:", err);
          }
        }

        // Map AI structured data to FilterState for visual feedback in filter panel
        const nextFilters: FilterState = {
          ...EMPTY_FILTERS,
          categoryIds: analysis.categories || [],
          subcategoryIds: analysis.subcategories?.map(s => s.subCategory_id) || [],
          minPrice: analysis.budget?.min ? String(analysis.budget.min) : "",
          maxPrice: analysis.budget?.max ? String(analysis.budget.max) : "",
          amenityIds: analysis.features || [],
          nearMe: Boolean(analysis.nearMe),
          locationNode,
        };
        setFilters(nextFilters);
        setDraftFilters(nextFilters);
      }
      setAiSearchOpen(false);
    } catch (err) {
      console.error("AI Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Reset AI results when filters are manually changed
  const handleFilterChange = (newFilters: FilterState) => {
    setDraftFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setFilters(draftFilters);
    setAiListings(null); // Clear AI results when manually refining
    setAiResponse(null);
    setFiltersOpen(false);
  };

  const displayedListings = (aiListings && aiListings.length > 0) ? aiListings : listings;
  const isUsingAiResults = aiListings !== null && aiListings.length > 0;

  // Helper to get labels for AI feedback
  const getCategoryLabel = (id: string) => {
    const cat = categoriesQuery.data?.find(c => c.id === id);
    return cat ? cat.name : null;
  };

  const getSubcategoryLabel = (id: string) => {
    // Note: since the analysis now returns objects, we could potentially get names from the API directly
    // but for now we'll stick to resolving them from our master data cache.
    const sub = appliedSubcategoriesQuery.data?.find(s => s.id === id);
    return sub ? sub.name : null;
  };

  return (
    <div className={`flex min-h-screen flex-col`}>

      <main className="flex flex-1 gap-6 p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto w-full">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <div className="mb-6 flex items-center justify-end sm:justify-between">
            <div className="hidden sm:block">
              <h1 className="text-3xl font-bold text-text-primary">
                {isUsingAiResults ? t("explore.ai_results_title") : t("explore.title")}
              </h1>
              <p className="mt-1 text-text-secondary">
                {t("explore.subtitle", { count: displayedListings.length })}
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

          {loading && !isUsingAiResults ? (
            <div className="flex flex-col gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-85 md:h-75 lg:h-50 rounded-2xl bg-(--border)/50 animate-pulse" />
              ))}
            </div>
          ) : displayedListings.length > 0 ? (
            <div className="gap-6 flex flex-col">
              {displayedListings.map((listing) => (
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
              onChange={handleFilterChange}
              onApply={handleApplyFilters}
              onReset={(reset) => {
                setDraftFilters(reset);
                setFilters(reset);
                setAiListings(null);
                setAiResponse(null);
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
            onChange={handleFilterChange}
            onApply={handleApplyFilters}
            onReset={(reset) => {
              setDraftFilters(reset);
              setFilters(reset);
              setAiListings(null);
              setAiResponse(null);
            }}
          />
        </MobileBottomSheet>
      </div>

      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        title={t("auth.ai_search_login_title", "Login to search with AI")}
        description={t("auth.ai_search_login_desc", "Experience the power of AI search by logging in to your account.")}
      />

      <AiSearch
        open={aiSearchOpen}
        onOpenChange={(open) => {
          if (open && !isLoggedIn) {
            setLoginModalOpen(true);
          } else {
            setAiSearchOpen(open);
          }
        }}
        onSearch={handleSearch}
        isSearching={isSearching}
        buttonLabel="AI Search"
        buttonPosition="bottom-right"
        showMic={false}
        // onMicPress={() => console.log("Start voice input")}
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
        {/* AI Interpretation feedback */}
        {aiResponse && (
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex flex-wrap gap-2">
              {aiResponse.categories?.map((catId: string) => {
                const label = getCategoryLabel(catId);
                return label ? (
                  <span key={catId} className="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-600 dark:text-primary-400">
                    📂 {label}
                  </span>
                ) : null;
              })}
              {aiResponse.subcategories?.map((sub: AnalyzedSubcategory) => {
                const label = getSubcategoryLabel(sub.subCategory_id);
                return label ? (
                  <span key={sub.subCategory_id} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-foreground dark:text-accent">
                    🏷️ {label}
                  </span>
                ) : null;
              })}
              {aiResponse.vibeTags?.map((vibe: string) => {
                return (
                  <span key={vibe} className="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-600 dark:text-primary-400">
                    ✨ {vibe}
                  </span>
                );
              })}
              {aiResponse.lifestyleTags?.map((tag: string) => {
                return (
                  <span key={tag} className="rounded-full bg-tertiary-500/10 px-3 py-1 text-xs font-semibold text-tertiary-600 dark:text-tertiary-400">
                    🏠 {tag}
                  </span>
                );
              })}
            </div>
            {aiResponse.semanticQuery && (
              <p className="text-sm text-text-secondary italic">
                &ldquo;{aiResponse.semanticQuery}&rdquo;
              </p>
            )}
          </div>
        )}
      </AiSearch>
    </div>
  );
}

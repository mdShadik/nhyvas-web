"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExploreListing, exploreService } from "@/services/apiService/explore";
import { galliMapService } from "@/services/galliMap";
import { SlidersHorizontal, Search, ChevronDown, ArrowUpDown, ArrowUpWideNarrow, ArrowDownWideNarrow, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ExploreFiltersPanel } from "@/components/explore/ExploreFiltersPanel";
import { EMPTY_FILTERS, type FilterState } from "@/components/explore/exploreFilters";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { useTranslation } from "react-i18next";
import { ListingCard } from "@/components/explore/ListingCard";
import { formatPrice } from "@/lib/formatPrice";
import { SearchParamsProps } from "@/app/(pages)/explore/page";
import { AiSearch } from "@/components/AiSearch/Aisearch";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

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
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | null>(null);
  const [sortExpanded, setSortExpanded] = useState(false);

  const { isAuthenticated, profile, preferences, isLoading: authLoading } = useAuth();
  const isLoggedIn = isAuthenticated;

  useEffect(() => {
    if (didInitFromUrlRef.current) return;
    if (authLoading) return;

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

    const prefs = preferences;

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
  }, [searchParams, authLoading, preferences]);

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
      filterRadiusKm: hasLocationPoint ? 10 : null,
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

  const sidebarRecommendationsQuery = useQuery({
    queryKey: ["explore", "sidebar-recommendations", userLocation, preferences],
    queryFn: () => exploreService.getRecommendedListings({
      userLat: userLocation?.latitude,
      userLng: userLocation?.longitude,
      userRadiusKm: 10,
      limit: 6,
    }),
    // Always fetch some defaults if location isn't available yet
  });

  const listings = listingsQuery.data ?? [];
  const loading = listingsQuery.isLoading || listingsQuery.isFetching;

  const displayedListings = useMemo(() => {
    let result = [...listings];
    if (sortBy === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    }
    return result;
  }, [listings, sortBy]);

  const [aiSearchOpen, setAiSearchOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [aiResponse, setAiResponse] = useState<any | null>(null);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const { analysis } = await exploreService.aiSearch(
        query,
        userLocation?.latitude,
        userLocation?.longitude
      );

      setAiResponse(analysis);

      if (analysis) {
        let locationNode: FilterState["locationNode"] = null;
        if (analysis.location) {
          if (analysis.latitude != null && analysis.longitude != null) {
            // Use pre-resolved location from AI API
            locationNode = {
              id: `galli-${analysis.latitude}-${analysis.longitude}`,
              label: analysis.location,
              level: "ward" as const,
              state_id: null,
              district_id: null,
              municipality_id: null,
              ward_id: null,
              latitude: analysis.latitude,
              longitude: analysis.longitude,
            };
          } else {
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
        }

        // Map AI structured data to FilterState for visual feedback in filter panel
        const nextFilters: FilterState = {
          ...EMPTY_FILTERS,
          categoryIds: analysis.categories || [],
          subcategoryIds: analysis.subcategories?.map((s: any) => s.subCategory_id) || [],
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
    setAiResponse(null);
    setFiltersOpen(false);
  };

  const isUsingAiResults = aiResponse !== null;

  // Helper to get labels for AI feedback
  const getCategoryLabel = (id: string) => {
    const cat = categoriesQuery.data?.find(c => c.id === id);
    return cat ? cat.name : null;
  };

  const getSubcategoryLabel = (id: string) => {
    const sub = appliedSubcategoriesQuery.data?.find(s => s.id === id);
    return sub ? sub.name : null;
  };

  return (
    <div className={`flex min-h-screen flex-col bg-page`}>
      {/* Mobile Sticky Filter/Sort Bar */}
      <div className="sticky top-16 z-30 bg-page/95 backdrop-blur-md border-b border-border min-[748px]:hidden">
        <div className="flex items-center justify-between p-4 gap-3">
          <div
            className={`flex items-center gap-2 transition-all duration-300 overflow-hidden ${
              sortExpanded ? "flex-1" : "w-auto"
            }`}
          >
            <button
              onClick={() => setSortExpanded(!sortExpanded)}
              className={`flex items-center gap-2 rounded-2xl border border-border bg-bg-card px-4 py-2.5 text-sm font-bold text-text-primary shadow-sm whitespace-nowrap transition-all ${
                sortBy ? "border-primary-500/50 bg-primary-500/5" : ""
              }`}
            >
              <ArrowUpDown className="h-4 w-4 text-primary-500" />
              {sortExpanded ? "Sort" : sortBy ? (sortBy === "price_asc" ? "Low to High" : "High to Low") : "Sort By"}
            </button>

            {sortExpanded && (
              <div className="flex gap-2 items-center overflow-x-auto scrollbar-hide animate-in slide-in-from-left-4 duration-300 pr-2">
                <button
                  onClick={() => {
                    setSortBy("price_asc");
                    setSortExpanded(false);
                  }}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                    sortBy === "price_asc"
                      ? "border-primary-500 bg-primary-500/10 text-primary-600"
                      : "border-border bg-bg-card text-text-secondary"
                  }`}
                >
                  <ArrowUpWideNarrow className="h-3.5 w-3.5" />
                  Low to High
                </button>
                <button
                  onClick={() => {
                    setSortBy("price_desc");
                    setSortExpanded(false);
                  }}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                    sortBy === "price_desc"
                      ? "border-primary-500 bg-primary-500/10 text-primary-600"
                      : "border-border bg-bg-card text-text-secondary"
                  }`}
                >
                  <ArrowDownWideNarrow className="h-3.5 w-3.5" />
                  High to Low
                </button>
                {sortBy && (
                  <button
                    onClick={() => {
                      setSortBy(null);
                      setSortExpanded(false);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-accent/20 bg-accent/5 px-3 py-2 text-xs font-bold text-accent whitespace-nowrap transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {!sortExpanded && (
            <button
              type="button"
              onClick={() => {
                setDraftFilters(filters);
                setFiltersOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-bg-card px-4 py-2.5 text-sm font-bold text-text-primary shadow-sm transition-all active:scale-95"
            >
              <SlidersHorizontal className="h-4 w-4 text-primary-500" />
              {t("common.filters")}
            </button>
          )}
        </div>
      </div>

      <main className="flex w-full max-w-screen-2xl flex-1 gap-4 p-4 sm:p-6 lg:gap-6 lg:p-8 mx-auto">
        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 min-[748px]:top-24 z-20 mb-6 flex items-center justify-between bg-page/95 py-4 backdrop-blur-md min-[748px]:pb-6">
            <div className="hidden sm:block">
              <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
                {isUsingAiResults ? t("explore.ai_results_title") : t("explore.title")}
              </h1>
              <p className="mt-1 text-text-secondary font-medium">
                {t("explore.subtitle", { count: displayedListings.length })}
              </p>
            </div>

            {/* Desktop Sort Dropdown */}
            <div className="hidden min-[748px]:flex items-center gap-3">
              <div className="relative group">
                <button className="flex items-center gap-2 rounded-2xl border border-border bg-bg-card px-4 py-3 text-sm font-bold text-text-primary hover:border-primary-500/50 transition-all hover:shadow-md">
                  <ArrowUpDown className="h-4 w-4 text-primary-500" />
                  {sortBy === "price_asc"
                    ? "Price: Low to High"
                    : sortBy === "price_desc"
                      ? "Price: High to Low"
                      : "Sort By Price"}
                  <ChevronDown className="h-4 w-4 text-text-secondary group-hover:rotate-180 transition-transform" />
                </button>
                {/* Bridge to fix hover gap */}
                <div className="absolute right-0 top-full w-full h-4 pointer-events-none group-hover:pointer-events-auto" />
                <div className="absolute right-0 top-[calc(100%+8px)] w-56 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all z-50">
                  <div className="rounded-2xl border border-border bg-bg-card shadow-2xl p-1.5 backdrop-blur-xl">
                    <button
                      onClick={() => setSortBy("price_asc")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        sortBy === "price_asc"
                          ? "bg-primary-500/10 text-primary-600"
                          : "hover:bg-secondary-50 dark:hover:bg-secondary-800 text-text-secondary"
                      }`}
                    >
                      <ArrowUpWideNarrow className="h-4 w-4" />
                      Price: Low to High
                    </button>
                    <button
                      onClick={() => setSortBy("price_desc")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        sortBy === "price_desc"
                          ? "bg-primary-500/10 text-primary-600"
                          : "hover:bg-secondary-50 dark:hover:bg-secondary-800 text-text-secondary"
                      }`}
                    >
                      <ArrowDownWideNarrow className="h-4 w-4" />
                      Price: High to Low
                    </button>
                    {sortBy && (
                      <button
                        onClick={() => setSortBy(null)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-accent hover:bg-accent/5 transition-all border-t border-border mt-1"
                      >
                        Clear Sorting
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading && !isUsingAiResults ? (
            <div className="flex flex-col gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-85 md:h-75 lg:h-50 rounded-2xl bg-(--border)/50 animate-pulse" />
              ))}
            </div>
          ) : displayedListings.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-6">
              {displayedListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-(--card-bg) p-12 text-center">
              <Search className="mb-4 h-12 w-12 text-muted" />
              <h3 className="text-lg font-semibold text-text-primary">{t("explore.no_properties")}</h3>
              <p className="mt-2 max-w-sm text-text-secondary">{t("explore.no_properties_desc")}</p>
            </div>
          )}
        </div>

        {/* Right Sidebar - Filters & Recommendations */}
        <aside className="hidden w-[260px] shrink-0 min-[748px]:block md:w-[280px] lg:w-[320px] xl:w-[360px] 2xl:w-[400px]">
          <div className="sticky top-24 flex flex-col gap-6">
            <div className="rounded-3xl border border-border bg-page-bg-from p-4 shadow-sm lg:p-6">
              <ExploreFiltersPanel
                value={draftFilters}
                onChange={handleFilterChange}
                onApply={handleApplyFilters}
                onReset={(reset) => {
                  setDraftFilters(reset);
                  setFilters(reset);
                  setAiResponse(null);
                }}
              />
            </div>

            <div className="rounded-3xl border border-border bg-bg-card/40 p-4 shadow-sm lg:p-6">
              <h3 className="text-lg font-black text-text-primary mb-5 tracking-tight">
                Recommended For You
              </h3>
              <div className="flex flex-col gap-5">
                {sidebarRecommendationsQuery.isLoading ? (
                  [1, 2, 3].map((n) => (
                    <div key={n} className="flex gap-3 animate-pulse">
                      <div className="h-16 w-16 shrink-0 rounded-xl bg-secondary-100 dark:bg-secondary-800" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 w-3/4 rounded bg-secondary-100 dark:bg-secondary-800" />
                        <div className="h-3 w-1/2 rounded bg-secondary-100 dark:bg-secondary-800" />
                      </div>
                    </div>
                  ))
                ) : (
                  sidebarRecommendationsQuery.data?.slice(0, 5).map((listing) => (
                    <Link
                      key={listing.id}
                      href={{ pathname: "/property", query: { id: listing.id } }}
                      className="group flex gap-3 items-center"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary-100 dark:bg-secondary-800">
                        {listing.thumbnail_url ? (
                          <img
                            src={listing.thumbnail_url}
                            alt={listing.property_title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-115"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-secondary-100 dark:bg-secondary-800">
                            <Search className="h-6 w-6 text-text-secondary/20" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-text-primary truncate transition-colors group-hover:text-primary-600">
                          {listing.property_title}
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-text-secondary mt-0.5">
                          <MapPin className="h-3 w-3 text-primary-500" />
                          <span className="truncate">{listing.location_text}</span>
                        </div>
                        <p className="text-sm font-black text-primary-600 dark:text-primary-400 mt-1">
                          {formatPrice(listing.price, listing.currency_code)}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>
      </main>

      <div className="min-[748px]:hidden">
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
        aiRemainingCredit={profile?.ai_remaining_credit}
        buttonLabel="AI Search"
        buttonPosition="bottom-right"
        showMic={false}
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
              {aiResponse.subcategories?.map((sub: any) => {
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

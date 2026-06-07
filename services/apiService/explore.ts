import { mapExploreListingRows } from "@/services/apiService/mappers";
import { registerMasterAmenities, registerMasterPropertyCategories, registerMasterPropertySubcategories } from "@/i18n/masterData";
import { requestJson } from "@/services/apiService/http";
import { galliMapService } from "../galliMap";

export type HomeHeroListing = {
  id: string;
  property_title: string;
  property_category: string;
  location_text: string;
  price: number;
  currency_code: string;
  thumbnail_url: string | null;
  photo_urls: string[];
  landlord_is_verified: boolean;
  is_featured: boolean;
};

export type HomeCategory = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  display_order: number;
};

export type ExploreListing = {
  id: string;
  listed_by?: string | null;
  property_title: string;
  property_category: string;
  property_category_name: string;
  property_category_id: string;
  subcategory: string | null;
  subcategory_name: string | null;
  subcategory_id: string | null;
  location_text: string;
  latitude?: number | null;
  longitude?: number | null;
  show_exact_location?: boolean;
  state_id: string | null;
  district_id: string | null;
  municipality_id: string | null;
  ward_id: string | null;
  price: number;
  is_negotiable?: boolean;
  currency_code: string;
  thumbnail_url: string | null;
  photo_urls: string[];
  amenity_tags: string[];
  total_area_sqft?: number | null;
  carpet_area_sqft?: number | null;
  total_floor?: number | null;
  property_floor_no?: number | null;
  landlord_is_verified: boolean;
  is_featured: boolean;
  is_rented?: boolean;
  /** When true, owner may publish a 24h walkthrough story after approval */
  is_story?: boolean;
  story_image_limit?: number;
  story_video_limit?: number;
  status?: string;
  approval_fee_percentage?: number | null;
  approval_fee_amount?: number | null;
  moderator_note?: string | null;
  submitted_at: string;
  view_count?: number | null;
};

export type ListingDetails = ExploreListing & {
  description: string;
  updated_at: string | null;
};

export type ListingAmenity = {
  id: string;
  name: string;
  code: string;
  category_id: string;
  category_name: string;
  category_code: string;
};

export type ListingDetailsResponse = {
  listing: ListingDetails | null;
  enrichedAmenities: ListingAmenity[];
};

export type ExploreFilters = {
  categoryIds?: string[] | null;
  subcategoryIds?: string[] | null;
  stateId?: string | null;
  districtId?: string | null;
  municipalityId?: string | null;
  wardId?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  amenityTags?: string[] | null;
  filterLat?: number | null;
  filterLng?: number | null;
  filterRadiusKm?: number | null;
  userLat?: number | null;
  userLng?: number | null;
  userRadiusKm?: number | null;
  search?: string | null;
  sortBy?: "price_asc" | "price_desc" | "newest" | "oldest" | null;
  limit?: number;
  offset?: number;
};

export type MasterSubcategory = {
  id: string;
  category_id: string;
  code: string;
  name: string;
  display_order: number;
};



export type LocationSearchNode = {
  level: "ward" | "municipality" | "district" | "state";
  id: string;
  label: string;
  state_id: string | null;
  district_id: string | null;
  municipality_id: string | null;
  ward_id: string | null;
  latitude: number | null;
  longitude: number | null;
};

type NepalLocationRow = {
  id: string;
  level: "ward" | "municipality" | "district" | "state";
  pcode?: string | null;
  name_en: string;
  parent_id: string | null;
  center_point?: string | null;
};

type NepalSearchRow = {
  level: LocationSearchNode["level"];
  id: string;
  label: string;
  state_id: string | null;
  district_id: string | null;
  municipality_id: string | null;
  ward_id: string | null;
  latitude: number | null;
  longitude: number | null;
};

function parsePointWkt(
  value: string | null | undefined
): { latitude: number; longitude: number } | null {
  if (!value) return null;
  const match = value.match(/POINT\s*\(\s*([0-9.+-]+)\s+([0-9.+-]+)\s*\)/i);
  if (!match) return null;
  const lon = Number(match[1]);
  const lat = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { latitude: lat, longitude: lon };
}

export type MasterAmenity = {
  id: string;
  name: string;
  code: string;
  category_id: string;
};

export type MasterAmenityCategory = {
  id: string;
  code: string;
  name: string;
  display_order: number;
};

export type MasterPriceConfig = {
  id: string;
  config_key: string;
  label: string;
  currency_code: string;
  min_value: number;
  max_value: number;
  step_value: number;
};

export type HomeGroupedCategory = {
  category_id: string;
  category_code: string;
  category_name: string;
  listings: ExploreListing[];
};

export const exploreService = {
  mapExploreRows(rows: any[]): ExploreListing[] {
    return mapExploreListingRows(rows);
  },

  async getHomeGroupedListings(params: {
    userLat?: number | null;
    userLng?: number | null;
    userRadiusKm?: number | null;
    listingsPerCategory?: number;
  }): Promise<HomeGroupedCategory[]> {
    const { rows } = await requestJson<{ rows: any[] }>("/api/explore/home-grouped", {
      method: "POST",
      body: JSON.stringify(params),
    });

    const groups = (rows ?? []).map((row: any) => ({
      ...row,
      listings: mapExploreListingRows(row.listings ?? []),
    })) as HomeGroupedCategory[];

    // Register categories for translation mapping
    registerMasterPropertyCategories(groups.map(g => ({
      id: g.category_id,
      code: g.category_code,
      name: g.category_name,
    })));

    return groups;
  },

  async getHomeHeroListings(limit = 8): Promise<HomeHeroListing[]> {
    const { rows } = await requestJson<{ rows: any[] }>("/api/explore/home-hero", {
      method: "POST",
      body: JSON.stringify({ limit }),
    });

    return (rows ?? []).map((row: any) => ({
      ...row,
      price: Number(row.price),
      photo_urls: row.photo_urls ?? [],
    }));
  },

  async getHomeCategories(limit = 12): Promise<HomeCategory[]> {
    const { rows } = await requestJson<{ rows: any[] }>("/api/explore/categories", {
      method: "POST",
      body: JSON.stringify({ limit }),
    });

    registerMasterPropertyCategories((rows ?? []) as any);

    return (rows ?? []).map((row: any) => ({
      ...row,
      display_order: Number(row.display_order ?? 0),
    }));
  },

  async getExploreListings(filters: ExploreFilters = {}): Promise<ExploreListing[]> {
    const { rows } = await requestJson<{ rows: any[] }>("/api/explore/listings", {
      method: "POST",
      body: JSON.stringify({ filters }),
    });
    return mapExploreListingRows(rows ?? []);
  },

  async getRecommendedListings(filters: ExploreFilters = {}): Promise<ExploreListing[]> {
    const { userLat, userLng, userRadiusKm, ...restFilters } = filters;
    const { rows } = await requestJson<{ rows: any[] }>("/api/explore/recommended", {
      method: "POST",
      body: JSON.stringify({ 
        filters: restFilters,
        userLat,
        userLng,
        userRadiusKm
      }),
    });
    return mapExploreListingRows(rows ?? []);
  },

  async searchLocationNodes(query: string, limit = 30, level?: string): Promise<LocationSearchNode[]> {
    const trimmed = query.trim();
    if (trimmed.length < 1) return [];

    const safeQuery = trimmed.replace(/\s+/g, " ").trim();
    if (safeQuery.length < 1) return [];

    try {
      // Use Kathmandu as default center if needed
      const data = await galliMapService.searchWithCurrentLocation(
        safeQuery,
        27.7172,
        85.3240
      );

      const features = data?.features || [];
      const mapped = features
        .filter((f) => f.properties && f.properties.searchedItem)
        .map((f) => {
          const p = f.properties;
          const labelParts = [p.searchedItem];
          if (p.municipality) labelParts.push(p.municipality);
          if (p.district) labelParts.push(p.district);
          
          const fullLabel = labelParts.filter(Boolean).join(", ");

          return {
            level: "ward" as const, 
            id: `${p.searchedItem}-${f.geometry.coordinates[1]}-${f.geometry.coordinates[0]}`,
            label: fullLabel,
            state_id: null,
            district_id: null,
            municipality_id: null,
            ward_id: null,
            latitude: f.geometry.coordinates[1],
            longitude: f.geometry.coordinates[0],
          } as LocationSearchNode;
        });

      return mapped.slice(0, limit);
    } catch (e) {
      console.error("Galli search Location Nodes Error", e);
      return [];
    }
  },

  async getListingDetails(listingId: string): Promise<ListingDetailsResponse> {
    const { row, enrichedAmenities } = await requestJson<{ row: any | null; enrichedAmenities: ListingAmenity[] }>("/api/explore/details", {
      method: "POST",
      body: JSON.stringify({ listingId }),
    });

    const listing: ListingDetails | null = row ? {
      ...row,
      price: Number(row.price),
      photo_urls: row.photo_urls ?? [],
      amenity_tags: row.amenity_tags ?? [],
      latitude: row.latitude != null ? Number(row.latitude) : null,
      longitude: row.longitude != null ? Number(row.longitude) : null,
      show_exact_location: row.show_exact_location ?? false,
      is_negotiable: row.is_negotiable ?? true,
      total_area_sqft: row.total_area_sqft != null ? Number(row.total_area_sqft) : null,
      carpet_area_sqft: row.carpet_area_sqft != null ? Number(row.carpet_area_sqft) : null,
      total_floor: row.total_floor != null ? Number(row.total_floor) : null,
      property_floor_no: row.property_floor_no != null ? Number(row.property_floor_no) : null,
      view_count: row.view_count != null ? Number(row.view_count) : 0,
      is_story: row.is_story ?? false,
      story_image_limit: row.story_image_limit != null ? Number(row.story_image_limit) : 5,
      story_video_limit: row.story_video_limit != null ? Number(row.story_video_limit) : 5,
      approval_fee_percentage: row.approval_fee_percentage != null ? Number(row.approval_fee_percentage) : null,
      approval_fee_amount: row.approval_fee_amount != null ? Number(row.approval_fee_amount) : null,
    } as ListingDetails : null;

    return { listing, enrichedAmenities: enrichedAmenities ?? [] };
  },

  async getSubcategoriesByCategoryIds(categoryIds: string[]): Promise<MasterSubcategory[]> {
    const { rows } = await requestJson<{ rows: any[] }>("/api/explore/subcategories", {
      method: "POST",
      body: JSON.stringify({ categoryIds }),
    });

    registerMasterPropertySubcategories((rows ?? []) as any);

    return (rows ?? []).map((row: any) => ({
      ...row,
      display_order: Number(row.display_order ?? 0),
    }));
  },



  async getAmenities(): Promise<MasterAmenity[]> {
    const { rows } = await requestJson<{ rows: any[] }>("/api/explore/amenities", { method: "POST" });
    registerMasterAmenities((rows ?? []) as any);
    return (rows ?? []) as MasterAmenity[];
  },

  async getAmenityCategories(): Promise<MasterAmenityCategory[]> {
    const { rows } = await requestJson<{ rows: any[] }>("/api/explore/amenity-categories", { method: "POST" });
    return (rows ?? []).map((row: any) => ({
      ...row,
      display_order: Number(row.display_order ?? 0),
    }));
  },

  async getPriceRangeConfig(configKey = "mobile_search_default"): Promise<MasterPriceConfig | null> {
    const { row } = await requestJson<{ row: any | null }>("/api/explore/price-config", {
      method: "POST",
      body: JSON.stringify({ configKey }),
    });
    if (!row) return null;

    return {
      ...row,
      min_value: Number((row as any).min_value ?? 0),
      max_value: Number((row as any).max_value ?? 0),
      step_value: Number((row as any).step_value ?? 1),
    };
  },

  async aiSearch(query: string, lat?: number | null, lng?: number | null): Promise<{
    analysis: any;
  }> {
    const { analysis } = await requestJson<{ analysis: any }>("/api/explore/ai-search", {
      method: "POST",
      body: JSON.stringify({ query, lat, lng }),
    });
    
    return {
      analysis,
    };
  },
};

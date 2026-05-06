import { mapExploreListingRows } from "@/services/apiService/mappers";
import { registerMasterAmenities, registerMasterPropertyCategories, registerMasterPropertySubcategories } from "@/i18n/masterData";
import { requestJson } from "@/services/apiService/http";

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
  subcategory: string | null;
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
  status?: string;
  moderator_note?: string | null;
  submitted_at: string;
};

export type ListingDetails = ExploreListing & {
  description: string;
  updated_at: string | null;
  total_area_sqft?: number | null;
  carpet_area_sqft?: number | null;
  total_floor?: number | null;
  property_floor_no?: number | null;
  view_count?: number | null;
};

export type ExploreFilters = {
  category?: string | null;
  subcategory?: string | null;
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

export const exploreService = {
  mapExploreRows(rows: any[]): ExploreListing[] {
    return mapExploreListingRows(rows);
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
    const { rows } = await requestJson<{ rows: any[] }>("/api/explore/recommended", {
      method: "POST",
      body: JSON.stringify({ filters }),
    });
    return mapExploreListingRows(rows ?? []);
  },

  async searchLocationNodes(query: string, limit = 30): Promise<LocationSearchNode[]> {
    const trimmed = query.trim();
    if (trimmed.length < 1) return [];

    const safeLimit = Math.max(1, Math.min(limit, 200));
    const safeQuery = trimmed.replace(/\s+/g, " ").trim();
    if (safeQuery.length < 1) return [];

    const { rows } = await requestJson<{ rows: NepalSearchRow[] }>("/api/explore/location-search", {
      method: "POST",
      body: JSON.stringify({ query: safeQuery, limit: safeLimit }),
    });

    return ((rows ?? []) as NepalSearchRow[]).map((row) => ({
      level: row.level,
      id: row.id,
      label: row.label,
      state_id: row.state_id ?? null,
      district_id: row.district_id ?? null,
      municipality_id: row.municipality_id ?? null,
      ward_id: row.ward_id ?? null,
      latitude: row.latitude != null ? Number(row.latitude) : null,
      longitude: row.longitude != null ? Number(row.longitude) : null,
    })) as LocationSearchNode[];
  },

  async getListingDetails(listingId: string): Promise<ListingDetails | null> {
    const { row } = await requestJson<{ row: any | null }>("/api/explore/details", {
      method: "POST",
      body: JSON.stringify({ listingId }),
    });
    if (!row) return null;

    return {
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
    } as ListingDetails;
  },

  async getSubcategoriesByCategoryCode(categoryCode: string): Promise<MasterSubcategory[]> {
    const { rows } = await requestJson<{ rows: any[] }>("/api/explore/subcategories", {
      method: "POST",
      body: JSON.stringify({ categoryCode }),
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
};

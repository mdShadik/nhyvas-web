import { galliMapService } from "./galliMap";

export type NepalLocationLevel = "state" | "district" | "municipality" | "ward";

export type NepalLocationRow = {
  id: string;
  name_en: string;
  level: NepalLocationLevel;
  parent_id: string | null;
  pcode: string;
};

export type NepalGeoPoint = { latitude: number; longitude: number };

export type NepalLookupResult = {
  ward: NepalLocationRow | null;
  municipality: NepalLocationRow | null;
  district: NepalLocationRow | null;
  state: NepalLocationRow | null;
  formattedAddress?: string;
};

export type NepalAdminSearchResult = {
  id: string;
  name_en: string;
  level: NepalLocationLevel;
  parent_id: string | null;
  pcode: string;
  center: NepalGeoPoint | null;
  hierarchy: NepalLookupResult;
};

/**
 * Robust spatial lookup for Nepal admin hierarchy at a coordinate.
 * Now exclusively uses Galli Map reverse geocoding.
 */
export async function lookupNepalAdminAtPoint(latitude: number, longitude: number): Promise<NepalLookupResult> {
  try {
    const result = await galliMapService.reverseGeocode(latitude, longitude);
    if (!result) throw new Error("Galli reverse geocode failed");

    // Since we no longer use internal IDs, we use the names as IDs for compatibility.
    // In a pure Galli Map flow, we mostly care about latitude/longitude and formattedAddress.
    return {
      ward: result.ward ? { id: result.ward, name_en: result.ward, level: "ward", parent_id: null, pcode: "" } : null,
      municipality: result.municipality ? { id: result.municipality, name_en: result.municipality, level: "municipality", parent_id: null, pcode: "" } : null,
      district: result.district ? { id: result.district, name_en: result.district, level: "district", parent_id: null, pcode: "" } : null,
      state: result.province ? { id: result.province, name_en: result.province, level: "state", parent_id: null, pcode: "" } : null,
      formattedAddress: result.generalName || `${result.municipality}, ${result.district}`,
    };
  } catch (error) {
    console.error("Galli reverse geocode error:", error);
    return {
      ward: null,
      municipality: null,
      district: null,
      state: null,
    };
  }
}

/**
 * @deprecated Project has moved to Galli Maps. This returns empty results.
 */
export async function searchNepalLocationsByName(level: NepalLocationLevel, query: string, limit = 20) {
  return [];
}

/**
 * @deprecated Project has moved to Galli Maps. This returns empty results.
 */
export async function getChildren(parentId: string, level: NepalLocationLevel, limit = 5000) {
  return [];
}

/**
 * Searches for location nodes using Galli Maps.
 * Returns a result compatible with the legacy NepalAdminSearchResult structure.
 */
export async function searchNepalAdminHierarchy(query: string, limit = 20): Promise<NepalAdminSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    // Kathmandu center as fallback
    const data = await galliMapService.searchWithCurrentLocation(q, 27.7172, 85.3240);
    const features = data?.features || [];

    return features
      .filter((f) => f.properties && f.properties.searchedItem)
      .map((f) => {
        const label = String(f.properties.searchedItem);
        return {
          id: label,
          name_en: label,
          level: "ward", // default to ward for compatibility
          parent_id: null,
          pcode: "",
          center: {
            latitude: f.geometry.coordinates[1],
            longitude: f.geometry.coordinates[0],
          },
          hierarchy: {
            ward: null,
            municipality: null,
            district: null,
            state: null,
            formattedAddress: label,
          },
        } as NepalAdminSearchResult;
      })
      .slice(0, limit);
  } catch (error) {
    console.error("Galli search error:", error);
    return [];
  }
}

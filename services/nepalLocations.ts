import { requestJson } from "@/services/apiService/http";
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

export async function lookupNepalAdminAtPoint(latitude: number, longitude: number): Promise<NepalLookupResult> {
  try {
    const result = await galliMapService.reverseGeocode(latitude, longitude);
    if (!result) throw new Error("Galli reverse geocode failed");

    // Map Galli Map result to our NepalLookupResult structure
    // Since we don't have IDs from Galli Map that match our DB, we'll use names as IDs or null
    return {
      ward: result.ward ? { id: result.ward, name_en: result.ward, level: "ward", parent_id: null, pcode: "" } : null,
      municipality: result.municipality ? { id: result.municipality, name_en: result.municipality, level: "municipality", parent_id: null, pcode: "" } : null,
      district: result.district ? { id: result.district, name_en: result.district, level: "district", parent_id: null, pcode: "" } : null,
      state: result.province ? { id: result.province, name_en: result.province, level: "state", parent_id: null, pcode: "" } : null,
      formattedAddress: result.generalName || `${result.municipality}, ${result.district}`,
    };
  } catch (error) {
    console.error("Galli reverse geocode error, falling back to empty:", error);
    return {
      ward: null,
      municipality: null,
      district: null,
      state: null,
    };
  }
}

export async function searchNepalLocationsByName(level: NepalLocationLevel, query: string, limit = 20) {
  const q = query.trim();
  if (!q) return [];

  const { rows } = await requestJson<{ rows: NepalLocationRow[] }>("/api/nepal/search-by-name", {
    method: "POST",
    body: JSON.stringify({ level, query: q, limit }),
  });
  return rows ?? [];
}

export async function getChildren(parentId: string, level: NepalLocationLevel, limit = 5000) {
  const { rows } = await requestJson<{ rows: NepalLocationRow[] }>("/api/nepal/children", {
    method: "POST",
    body: JSON.stringify({ parentId, level, limit }),
  });
  return rows ?? [];
}

export async function searchNepalAdminHierarchy(query: string, limit = 20): Promise<NepalAdminSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const { rows } = await requestJson<{ rows: NepalAdminSearchResult[] }>("/api/nepal/search-hierarchy", {
    method: "POST",
    body: JSON.stringify({ query: q, limit }),
  });
  return rows ?? [];
}

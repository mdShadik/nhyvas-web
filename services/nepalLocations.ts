import { requestJson } from "@/services/apiService/http";

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

type RpcRow = {
  ward_id: string | null;
  ward_name: string | null;
  ward_pcode: string | null;
  municipality_id: string | null;
  municipality_name: string | null;
  municipality_pcode: string | null;
  district_id: string | null;
  district_name: string | null;
  district_pcode: string | null;
  state_id: string | null;
  state_name: string | null;
  state_pcode: string | null;
};

function rowToLocation(level: NepalLocationLevel, id: string | null, name: string | null, pcode: string | null) {
  if (!id || !name || !pcode) return null;
  return { id, name_en: name, level, parent_id: null, pcode } satisfies NepalLocationRow;
}

export async function lookupNepalAdminAtPoint(latitude: number, longitude: number): Promise<NepalLookupResult> {
  const { row } = await requestJson<{ row: RpcRow }>("/api/nepal/lookup-point", {
    method: "POST",
    body: JSON.stringify({ latitude, longitude }),
  });

  return {
    ward: rowToLocation("ward", row.ward_id, row.ward_name, row.ward_pcode),
    municipality: rowToLocation("municipality", row.municipality_id, row.municipality_name, row.municipality_pcode),
    district: rowToLocation("district", row.district_id, row.district_name, row.district_pcode),
    state: rowToLocation("state", row.state_id, row.state_name, row.state_pcode),
  };
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

import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

type NepalLocationLevel = "state" | "district" | "municipality" | "ward";

type NepalLocationRow = {
  id: string;
  name_en: string;
  level: NepalLocationLevel;
  parent_id: string | null;
  pcode: string;
};

type NepalGeoPoint = { latitude: number; longitude: number };

type NepalLookupResult = {
  ward: NepalLocationRow | null;
  municipality: NepalLocationRow | null;
  district: NepalLocationRow | null;
  state: NepalLocationRow | null;
};

type NepalAdminSearchResult = {
  id: string;
  name_en: string;
  level: NepalLocationLevel;
  parent_id: string | null;
  pcode: string;
  center: NepalGeoPoint | null;
  hierarchy: NepalLookupResult;
};

function rowToLocation(level: NepalLocationLevel, id: string | null, name: string | null, pcode: string | null) {
  if (!id || !name || !pcode) return null;
  return { id, name_en: name, level, parent_id: null, pcode } satisfies NepalLocationRow;
}

function parseCenterPoint(value: unknown): NepalGeoPoint | null {
  if (!value) return null;

  if (typeof value === "object") {
    const anyValue = value as any;
    const coords = anyValue?.coordinates;
    if (Array.isArray(coords) && coords.length >= 2) {
      const longitude = Number(coords[0]);
      const latitude = Number(coords[1]);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) return { latitude, longitude };
    }
  }

  if (typeof value === "string") {
    const match = value.match(/point\\s*\\(\\s*([-\\d.]+)\\s+([-\\d.]+)\\s*\\)/i);
    if (match) {
      const longitude = Number(match[1]);
      const latitude = Number(match[2]);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) return { latitude, longitude };
    }

    const hex = value.trim();
    if (/^[0-9a-fA-F]+$/.test(hex) && hex.length >= 42) {
      try {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i += 1) {
          bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
        }
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const littleEndian = view.getUint8(0) === 1;
        const type = view.getUint32(1, littleEndian);
        const hasSrid = (type & 0x20000000) !== 0;
        const geomType = type & 0x000000ff;
        if (geomType !== 1) return null;
        let offset = 5;
        if (hasSrid) offset += 4;
        const longitude = view.getFloat64(offset, littleEndian);
        const latitude = view.getFloat64(offset + 8, littleEndian);
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) return { latitude, longitude };
      } catch {
        // ignore
      }
    }
  }

  return null;
}

function buildHierarchyForHit(hit: NepalLocationRow, byId: Map<string, NepalLocationRow>): NepalLookupResult {
  if (hit.level === "state") return { state: hit, district: null, municipality: null, ward: null };

  if (hit.level === "district") {
    const state = hit.parent_id ? (byId.get(hit.parent_id) ?? null) : null;
    return { state, district: hit, municipality: null, ward: null };
  }

  if (hit.level === "municipality") {
    const district = hit.parent_id ? (byId.get(hit.parent_id) ?? null) : null;
    const state = district?.parent_id ? (byId.get(district.parent_id) ?? null) : null;
    return { state, district, municipality: hit, ward: null };
  }

  const municipality = hit.parent_id ? (byId.get(hit.parent_id) ?? null) : null;
  const district = municipality?.parent_id ? (byId.get(municipality.parent_id) ?? null) : null;
  const state = district?.parent_id ? (byId.get(district.parent_id) ?? null) : null;
  return { state, district, municipality, ward: hit };
}

function scoreNameMatch(name: string, query: string) {
  const n = name.toLowerCase();
  const q = query.toLowerCase();
  if (n === q) return 4;
  if (n.startsWith(q)) return 3;
  if (n.includes(q)) return 2;
  return 0;
}

type NepalLocationWithCenterRow = NepalLocationRow & { center_point?: unknown };

async function getLocationsByIds(supabase: ReturnType<typeof createSupabasePublicClient>, ids: string[]) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return [] as NepalLocationWithCenterRow[];

  const { data, error } = await supabase
    .from("nepals_location_table")
    .select("id,name_en,level,parent_id,pcode,center_point")
    .in("id", unique);

  if (error) throw error;
  return (data ?? []) as NepalLocationWithCenterRow[];
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { query?: string; limit?: number };
  const q = typeof body?.query === "string" ? body.query.trim() : "";
  if (q.length < 2) return jsonOk({ rows: [] });
  const limit = typeof body?.limit === "number" ? body.limit : 20;

  const wantsWard = /\\bward\\b/i.test(q);
  const wardLimit = Math.min(Math.max(limit, 12), 30);
  const otherLimit = Math.min(Math.max(Math.ceil(limit / 2), 6), 20);

  const supabase = createSupabasePublicClient();
  const [wards, municipalities, districts] = await Promise.all([
    supabase
      .from("nepals_location_table")
      .select("id,name_en,level,parent_id,pcode,center_point")
      .eq("level", "ward")
      .ilike("name_en", `%${q}%`)
      .limit(wantsWard ? wardLimit : Math.min(wardLimit, otherLimit)),
    supabase
      .from("nepals_location_table")
      .select("id,name_en,level,parent_id,pcode,center_point")
      .eq("level", "municipality")
      .ilike("name_en", `%${q}%`)
      .limit(otherLimit),
    supabase
      .from("nepals_location_table")
      .select("id,name_en,level,parent_id,pcode,center_point")
      .eq("level", "district")
      .ilike("name_en", `%${q}%`)
      .limit(otherLimit),
  ]);

  if (wards.error) return jsonError(wards.error.message, 400);
  if (municipalities.error) return jsonError(municipalities.error.message, 400);
  if (districts.error) return jsonError(districts.error.message, 400);

  const combined = [
    ...((wards.data ?? []) as NepalLocationWithCenterRow[]),
    ...((municipalities.data ?? []) as NepalLocationWithCenterRow[]),
    ...((districts.data ?? []) as NepalLocationWithCenterRow[]),
  ];

  const uniqueById = new Map<string, NepalLocationWithCenterRow>();
  for (const row of combined) uniqueById.set(row.id, row);
  const hits = Array.from(uniqueById.values());

  hits.sort((a, b) => {
    const as = scoreNameMatch(a.name_en, q) + (a.level === "ward" ? 0.25 : 0);
    const bs = scoreNameMatch(b.name_en, q) + (b.level === "ward" ? 0.25 : 0);
    return bs - as;
  });

  const limitedHits = hits.slice(0, limit);
  const byId = new Map<string, NepalLocationRow>();
  for (const row of limitedHits) byId.set(row.id, row);

  let frontier = limitedHits.map((r) => r.parent_id).filter(Boolean) as string[];
  for (let i = 0; i < 3 && frontier.length > 0; i += 1) {
    const missing = frontier.filter((id) => !byId.has(id));
    if (missing.length === 0) break;
    const parents = await getLocationsByIds(supabase, missing);
    for (const p of parents) byId.set(p.id, p);
    frontier = parents.map((p) => p.parent_id).filter(Boolean) as string[];
  }

  const rows: NepalAdminSearchResult[] = limitedHits.map((hit) => ({
    id: hit.id,
    name_en: hit.name_en,
    level: hit.level,
    parent_id: hit.parent_id,
    pcode: hit.pcode,
    center: parseCenterPoint((hit as any).center_point),
    hierarchy: buildHierarchyForHit(hit, byId),
  }));

  return jsonOk({ rows });
}


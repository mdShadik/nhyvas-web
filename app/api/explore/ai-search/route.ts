import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { analyzeQuery, AiMapping } from "@/lib/ai/queryAnalyzer";
import { generateEmbedding } from "@/lib/ai/embedding";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";

const AI_LOCATION_RADIUS_KM = 25;
const AI_SEARCH_LIMIT = 40;
const AI_SEARCH_LOCATION_CANDIDATE_LIMIT = 120;
const GALLI_SEARCH_TIMEOUT_MS = 1500;
const AI_MAPPINGS_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_NEPAL_CENTER = { latitude: 27.7172, longitude: 85.324 };

const NEPAL_LOCATION_CENTERS: Record<string, { label: string; latitude: number; longitude: number }> = {
  kathmandu: { label: "Kathmandu", latitude: 27.7172, longitude: 85.324 },
  ktm: { label: "Kathmandu", latitude: 27.7172, longitude: 85.324 },
  lalitpur: { label: "Lalitpur", latitude: 27.6588, longitude: 85.3247 },
  patan: { label: "Lalitpur", latitude: 27.6588, longitude: 85.3247 },
  bhaktapur: { label: "Bhaktapur", latitude: 27.671, longitude: 85.4298 },
  chitwan: { label: "Chitwan", latitude: 27.5819, longitude: 84.2491 },
  bharatpur: { label: "Bharatpur", latitude: 27.6833, longitude: 84.4333 },
  pokhara: { label: "Pokhara", latitude: 28.2096, longitude: 83.9856 },
  kaski: { label: "Kaski", latitude: 28.2622, longitude: 83.972 },
  butwal: { label: "Butwal", latitude: 27.7006, longitude: 83.4484 },
  rupandehi: { label: "Rupandehi", latitude: 27.533, longitude: 83.45 },
  lumbini: { label: "Lumbini", latitude: 27.4698, longitude: 83.2756 },
  biratnagar: { label: "Biratnagar", latitude: 26.4525, longitude: 87.2718 },
  morang: { label: "Morang", latitude: 26.65, longitude: 87.5 },
  birgunj: { label: "Birgunj", latitude: 27.0104, longitude: 84.8774 },
  parsa: { label: "Parsa", latitude: 27.2196, longitude: 84.8663 },
  janakpur: { label: "Janakpur", latitude: 26.7288, longitude: 85.9257 },
  dhanusha: { label: "Dhanusha", latitude: 26.835, longitude: 86.0122 },
  hetauda: { label: "Hetauda", latitude: 27.4284, longitude: 85.0322 },
  makwanpur: { label: "Makwanpur", latitude: 27.5546, longitude: 85.022 },
  dharan: { label: "Dharan", latitude: 26.8144, longitude: 87.2797 },
  sunsari: { label: "Sunsari", latitude: 26.627, longitude: 87.1822 },
  nepalgunj: { label: "Nepalgunj", latitude: 28.05, longitude: 81.6167 },
  banke: { label: "Banke", latitude: 28.095, longitude: 81.6992 },
  dhangadhi: { label: "Dhangadhi", latitude: 28.7014, longitude: 80.5898 },
  kailali: { label: "Kailali", latitude: 28.7309, longitude: 80.6816 },
};

type AiSearchRequestBody = {
  query?: string;
  lat?: number | null;
  lng?: number | null;
};

type AiSearchListingRow = {
  id: string;
};

type ListingCoordinateRow = {
  id: string;
  latitude: number | string | null;
  longitude: number | string | null;
};

type ResolvedLocation = {
  label: string;
  latitude: number;
  longitude: number;
};

let aiMappingsCache: { expiresAt: number; data: AiMapping[] } | null = null;

function toFiniteNumber(value: unknown): number | null {
  const num = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(num) ? num : null;
}

function distanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const lat1 = toRad(fromLat);
  const lat2 = toRad(toLat);
  const deltaLat = toRad(toLat - fromLat);
  const deltaLng = toRad(toLng - fromLng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizeLocationKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\b(nepal|district|municipality|metro|metropolitan|submetropolitan|sub-metropolitan)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getLocalNepalLocation(location: string): ResolvedLocation | null {
  const key = normalizeLocationKey(location);
  if (!key) return null;
  return NEPAL_LOCATION_CENTERS[key] ?? null;
}

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveLocationWithGalli(location: string, isWardSearch: boolean, wardNumber: number | undefined, lat?: number | null, lng?: number | null): Promise<ResolvedLocation | null> {
  const searchQuery = isWardSearch && wardNumber ? `${location} ward ${wardNumber}` : location;
  const localLocation = getLocalNepalLocation(searchQuery) ?? getLocalNepalLocation(location);
  if (localLocation) return localLocation;

  const apiKey = process.env.NEXT_PUBLIC_GALLI_MAP_API_KEY;
  if (!apiKey) return null;

  const refLat = lat ?? DEFAULT_NEPAL_CENTER.latitude;
  const refLng = lng ?? DEFAULT_NEPAL_CENTER.longitude;
  const galliUrl = `https://route-init.gallimap.com/api/v1/search/currentLocation?accessToken=${apiKey}&name=${encodeURIComponent(searchQuery)}&currentLat=${refLat}&currentLng=${refLng}`;
  const galliRes = await fetchWithTimeout(galliUrl, GALLI_SEARCH_TIMEOUT_MS);
  if (!galliRes.ok) return null;

  const galliData = await galliRes.json();
  if (!galliData.success || !galliData.data?.features?.length) return null;

  const feature = galliData.data.features[0];
  const resolvedLat = toFiniteNumber(feature.geometry?.coordinates?.[1]);
  const resolvedLng = toFiniteNumber(feature.geometry?.coordinates?.[0]);
  if (resolvedLat == null || resolvedLng == null) return null;

  return {
    label: feature.properties?.searchedItem || location,
    latitude: resolvedLat,
    longitude: resolvedLng,
  };
}

export async function POST(req: Request) {
  try {
    const { query, lat, lng } = (await req.json()) as AiSearchRequestBody;
    if (!query) return jsonError("Query is required", 400);

    const supabase = (await getAuthenticatedClientOrNull()) ?? createSupabasePublicClient();

    // Mapping fetch and embedding generation are independent, so start both at once.
    const dynamicMappingsPromise = (async () => {
      if (aiMappingsCache && aiMappingsCache.expiresAt > Date.now()) {
        return aiMappingsCache.data;
      }

      const { data, error } = await supabase
        .from("ai_query_mappings")
        .select("map_type, keyword, mapped_id, mapped_value, mapped_parent_id")
        .eq("is_active", true);

      if (error) throw error;

      const mappings = (data as AiMapping[] | null) || [];
      aiMappingsCache = {
        data: mappings,
        expiresAt: Date.now() + AI_MAPPINGS_CACHE_TTL_MS,
      };
      return mappings;
    })();
    const embeddingPromise = generateEmbedding(query);

    // 1. Fetch dynamic mappings from admin config
    const dynamicMappings = await dynamicMappingsPromise;

    // 2. Analyze query with dynamic mappings
    const analysis = analyzeQuery(query, dynamicMappings);

    // 3. Resolve location using Galli Maps if detected
    let filterLat = null;
    let filterLng = null;

    if (analysis.location) {
      try {
        const resolvedLocation = await resolveLocationWithGalli(
          analysis.location,
          analysis.isWardSearch,
          analysis.wardNumber,
          lat,
          lng
        );

        if (resolvedLocation) {
          filterLat = resolvedLocation.latitude;
          filterLng = resolvedLocation.longitude;
          analysis.location = resolvedLocation.label;
          analysis.latitude = filterLat;
          analysis.longitude = filterLng;
        }
      } catch (err) {
        console.error("Galli Map resolution error in AI search:", err);
      }
    }

    // 4. Generate embedding server-side
    const embedding = await embeddingPromise;

    // 5. Perform Hybrid Search in Supabase
    // We use filterLat/Lng if available, otherwise fallback to user lat/lng if nearMe is true
    const searchLat = filterLat ?? (analysis.nearMe ? lat : null);
    const searchLng = filterLng ?? (analysis.nearMe ? lng : null);

    const { data: listings, error } = await supabase.rpc("hybrid_property_search", {
      query_text: analysis.keywordQuery,
      query_embedding: embedding,
      p_limit: searchLat != null && searchLng != null ? AI_SEARCH_LOCATION_CANDIDATE_LIMIT : AI_SEARCH_LIMIT,
      p_offset: 0,
      p_categories: analysis.categories.length ? analysis.categories : null,
      p_subcategories: analysis.subcategories.length ? analysis.subcategories.map(s => s.subCategory_id) : null,
      p_min_price: analysis.budget.min,
      p_max_price: analysis.budget.max,
      p_user_lat: searchLat,
      p_user_lng: searchLng,
    });

    if (error) {
      console.error("Hybrid Search Error:", error);
      return jsonError(error.message, 500);
    }

    let filteredListings = listings || [];

    // hybrid_property_search only boosts nearby listings; it does not filter by distance.
    // For explicit locations like "flat at Chitwan", keep only nearby candidates so
    // a weak global semantic match from another city does not appear as a result.
    if (analysis.location && searchLat != null && searchLng != null && filteredListings.length > 0) {
      const ids = (filteredListings as AiSearchListingRow[]).map((listing) => listing.id);
      const { data: coordinateRows, error: coordinateError } = await supabase
        .from("listing_moderation_queue")
        .select("id, latitude, longitude")
        .in("id", ids);

      if (coordinateError) {
        console.error("AI Search Coordinate Filter Error:", coordinateError);
        return jsonError(coordinateError.message, 500);
      }

      const distanceById = new Map<string, number>();
      (coordinateRows as ListingCoordinateRow[] | null)?.forEach((row) => {
        const listingLat = toFiniteNumber(row.latitude);
        const listingLng = toFiniteNumber(row.longitude);
        if (listingLat == null || listingLng == null) return;

        const distance = distanceKm(searchLat, searchLng, listingLat, listingLng);
        if (distance <= AI_LOCATION_RADIUS_KM) {
          distanceById.set(row.id, distance);
        }
      });

      filteredListings = (filteredListings as AiSearchListingRow[])
        .filter((listing) => distanceById.has(listing.id))
        .sort((a, b) => (distanceById.get(a.id) ?? 0) - (distanceById.get(b.id) ?? 0))
        .slice(0, AI_SEARCH_LIMIT);
    }

    return jsonOk({
      listings: filteredListings,
      analysis,
    });
  } catch (err: unknown) {
    console.error("AI Search Error:", err);
    return jsonError(err instanceof Error ? err.message : "Internal server error", 500);
  }
}

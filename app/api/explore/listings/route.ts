import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";

type ExploreFilters = {
  categoryIds?: string[] | null;
  subcategoryIds?: string[] | null;
  stateId?: string | null;
  districtId?: string | null;
  municipalityId?: string | null;
  wardId?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  amenityTags?: string[] | null;
  limit?: number;
  offset?: number;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { filters?: ExploreFilters };
  const filters = body?.filters ?? {};

  // If the user is logged in, use an authenticated Supabase client so the RPC can
  // exclude the caller's own listings (see get_app_explore_listings: auth.uid()).
  const supabase = (await getAuthenticatedClientOrNull()) ?? createSupabasePublicClient();
  const { data, error } = await supabase.rpc("get_app_explore_listings", {
    p_limit: filters.limit ?? 60,
    p_offset: filters.offset ?? 0,
    p_categories: filters.categoryIds ?? null,
    p_subcategories: filters.subcategoryIds ?? null,
    p_state_id: filters.stateId ?? null,
    p_district_id: filters.districtId ?? null,
    p_municipality_id: filters.municipalityId ?? null,
    p_ward_id: filters.wardId ?? null,
    p_min_price: filters.minPrice ?? null,
    p_max_price: filters.maxPrice ?? null,
    p_amenity_tags: filters.amenityTags?.length ? filters.amenityTags : null,
  });

  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [] });
}

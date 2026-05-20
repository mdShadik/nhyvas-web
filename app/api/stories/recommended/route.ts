import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | {
    userLat?: number | null;
    userLng?: number | null;
    userRadiusKm?: number | null;
    limit?: number;
    offset?: number;
  };

  const params = body ?? {};

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.rpc("get_app_property_stories_recommended", {
    // p_user_lat:  Number.isFinite(params.userLat) ? params.userLat : null,
    p_user_lat: 27.7017744,
    // p_user_lng: Number.isFinite(params.userLng) ? params.userLng : null,
    p_user_lng: 85.319558,
    p_user_radius_km: Number.isFinite(params.userRadiusKm) ? params.userRadiusKm : 5,
    p_limit: params.limit ?? 10,
    p_offset: params.offset ?? 0,
  });

  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [] });
}

import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { latitude?: number; longitude?: number };
  const latitude = typeof body?.latitude === "number" ? body.latitude : NaN;
  const longitude = typeof body?.longitude === "number" ? body.longitude : NaN;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return jsonError("latitude/longitude required", 400);

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.rpc("nepals_location_lookup", { p_lng: longitude, p_lat: latitude }).single();
  if (error) return jsonError(error.message, 400);
  return jsonOk({ row: data });
}


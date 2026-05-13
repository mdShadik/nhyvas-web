import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { propertyId?: string };
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId.trim() : "";
  if (!propertyId) return jsonError("propertyId is required", 400);

  const supabase = await getAuthenticatedClientOrNull();
  if (!supabase) return jsonOk({ viewed: false });

  const { data, error } = await supabase.rpc("get_app_has_viewed_listing", { p_listing_id: propertyId });
  if (error) return jsonError(error.message, 400);
  return jsonOk({ viewed: Boolean(data) });
}


import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { listingId?: string };
  const listingId = typeof body?.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) return jsonError("listingId is required", 400);

  const supabase = await getAuthenticatedClientOrNull();
  if (!supabase) return jsonError("Unauthorized", 401);

  const { data, error } = await supabase.rpc("get_app_listing_viewers", { p_listing_id: listingId });
  if (error) {
    return jsonError(error.message, 500);
  }
  return jsonOk({ viewers: data ?? [] });
}

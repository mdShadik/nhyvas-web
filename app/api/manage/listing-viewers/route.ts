import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { listingId?: string };
  const listingId = typeof body?.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) return jsonError("listingId is required", 400);

  const supabase = await createSupabaseUserClientOrThrow().catch(() => null);
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const { data, error } = await supabase.rpc("get_app_listing_viewers", { p_listing_id: listingId });
  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [] });
}


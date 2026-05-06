import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { listingId?: string };
  const listingId = typeof body?.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) return jsonError("listingId is required", 400);

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.rpc("get_app_listing_details", { p_listing_id: listingId });
  if (error) return jsonError(error.message, 400);

  const row = Array.isArray(data) ? data[0] : data;
  return jsonOk({ row: row ?? null });
}


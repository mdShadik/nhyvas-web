import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { listingId?: string };
  const listingId = typeof body?.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) return jsonError("listingId is required", 400);

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.rpc("get_app_listing_details", { p_listing_id: listingId });
  if (error) return jsonError(error.message, 400);

  let row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    const result = await createSupabaseUserClientOrThrow();
    if (result.success) {
      const { data: modData } = await result.client
        .from("listing_moderation_queue")
        .select("*")
        .eq("id", listingId)
        .maybeSingle();
      if (modData) row = modData;
    }
  }

  return jsonOk({ row: row ?? null });
}


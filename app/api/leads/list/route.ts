import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { listingId?: string | null };
  const listingId = typeof body?.listingId === "string" ? body.listingId : null;

  const supabase = await createSupabaseUserClientOrThrow().catch(() => null);
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const { data, error } = await supabase.rpc("get_app_property_leads", { p_listing_id: listingId ?? null });
  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [] });
}


import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { propertyId?: string; source?: string };
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId.trim() : "";
  if (!propertyId) return jsonError("propertyId is required", 400);
  const source = typeof body?.source === "string" ? body.source.trim() : "property_details";

  const supabase = await getAuthenticatedClientOrNull();
  if (!supabase) return jsonOk({ ok: true }); // non-blocking for anonymous users

  const { error } = await supabase.rpc("record_listing_view", { p_listing_id: propertyId, p_source: source });
  if (error) {
    // non-fatal; allow UI to proceed
    return jsonOk({ ok: true });
  }
  return jsonOk({ ok: true });
}


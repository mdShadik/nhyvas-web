import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { propertyId?: string };
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId.trim() : "";
  if (!propertyId) return jsonError("propertyId is required", 400);

  const supabase = createSupabasePublicClient();
  const { data: rows, error } = await supabase.rpc("get_app_active_property_stories_for_property", {
    p_property_id: propertyId,
  });
  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: rows ?? [] });
}

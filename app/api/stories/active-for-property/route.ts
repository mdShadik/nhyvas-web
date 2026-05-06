import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { propertyId?: string };
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId.trim() : "";
  if (!propertyId) return jsonError("propertyId is required", 400);

  const supabase = createSupabasePublicClient();
  const { data: ps, error } = await supabase
    .from("property_stories")
    .select("id, landlord_id, property_id, media_url, thumbnail_url, expires_at, created_at")
    .eq("property_id", propertyId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) return jsonError(error.message, 400);
  if (!ps) return jsonOk({ row: null });

  const [{ data: prof }, { data: listingRow }] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url").eq("id", (ps as any).landlord_id).maybeSingle(),
    supabase.from("listing_moderation_queue").select("property_title").eq("id", (ps as any).property_id).maybeSingle(),
  ]);

  return jsonOk({
    row: {
      story_id: (ps as any).id,
      landlord_id: (ps as any).landlord_id,
      property_id: (ps as any).property_id,
      media_url: (ps as any).media_url,
      thumbnail_url: (ps as any).thumbnail_url,
      expires_at: (ps as any).expires_at,
      landlord_name: (prof as any)?.full_name ?? "",
      landlord_avatar: (prof as any)?.avatar_url ?? null,
      property_title: (listingRow as any)?.property_title ?? "",
      created_at: (ps as any).created_at,
    },
  });
}


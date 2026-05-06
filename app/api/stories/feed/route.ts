import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST() {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.rpc("get_app_property_stories_feed");
  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [] });
}


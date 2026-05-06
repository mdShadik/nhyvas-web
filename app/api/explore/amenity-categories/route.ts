import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST() {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("master_amenity_categories")
    .select("id, code, name, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [] });
}


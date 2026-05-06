import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { configKey?: string };
  const configKey = typeof body?.configKey === "string" ? body.configKey.trim() : "mobile_search_default";

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("master_price_range_configs")
    .select("id, config_key, label, currency_code, min_value, max_value, step_value")
    .eq("is_active", true)
    .eq("config_key", configKey)
    .maybeSingle();

  if (error) return jsonError(error.message, 400);
  return jsonOk({ row: data ?? null });
}


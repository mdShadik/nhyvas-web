import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";

export async function POST() {
  const supabase = await createSupabaseUserClientOrThrow().catch(() => null);
  if (!supabase) return jsonOk({ profile: null, preferences: null });

  const { data, error } = await supabase.rpc("get_my_profile_bootstrap");
  if (error) return jsonError(error.message, 400);
  const row = Array.isArray(data) ? data[0] : data;
  return jsonOk({ row: row ?? null });
}


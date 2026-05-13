import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";

export async function POST() {
  const supabase = await getAuthenticatedClientOrNull();
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const { data, error } = await supabase.rpc("get_app_recently_viewed", { p_limit: 100, p_offset: 0 });
  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [] });
}


import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";

export async function POST() {
  const supabase = await getAuthenticatedClientOrNull();
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return jsonError(error.message, 400);
  return jsonOk({ ok: true });
}


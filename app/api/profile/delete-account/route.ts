import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";

export async function POST() {
  const supabase = await createSupabaseUserClientOrThrow().catch(() => null);
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return jsonError(error.message, 400);
  return jsonOk({ ok: true });
}


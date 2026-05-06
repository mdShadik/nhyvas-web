import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";
import { getUserIdOrThrow } from "@/app/api/_lib/auth";

export async function POST() {
  const supabase = await createSupabaseUserClientOrThrow().catch(() => null);
  if (!supabase) return jsonOk({ preferences: null });

  const userId = await getUserIdOrThrow(supabase).catch(() => null);
  if (!userId) return jsonOk({ preferences: null });

  const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle();
  if (error) return jsonError(error.message, 400);
  return jsonOk({ preferences: data ?? null });
}


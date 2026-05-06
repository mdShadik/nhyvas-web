import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";
import { getUserIdOrThrow } from "@/app/api/_lib/auth";

export async function POST() {
  const supabase = await createSupabaseUserClientOrThrow().catch(() => null);
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const userId = await getUserIdOrThrow(supabase).catch(() => null);
  if (!userId) return jsonError("You need to be logged in.", 401);

  const { data, error } = await supabase
    .from("listing_moderation_queue")
    .select("*")
    .eq("listed_by", userId)
    .order("created_at", { ascending: false });
  if (error) return jsonError(error.message, 400);
  return jsonOk({ rows: data ?? [] });
}


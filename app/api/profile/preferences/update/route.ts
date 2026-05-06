import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";
import { getUserIdOrThrow } from "@/app/api/_lib/auth";

export async function POST(req: Request) {
  const input = (await req.json().catch(() => null)) as null | Record<string, unknown>;

  const supabase = await createSupabaseUserClientOrThrow().catch(() => null);
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const userId = await getUserIdOrThrow(supabase).catch(() => null);
  if (!userId) return jsonError("You need to be logged in.", 401);

  const payload = {
    user_id: userId,
    ...(input ?? {}),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("user_preferences").upsert(payload as any, { onConflict: "user_id" });
  if (error) return jsonError(error.message, 400);
  return jsonOk({ ok: true });
}


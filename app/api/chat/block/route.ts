import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";
import { getUserIdOrThrow } from "@/app/api/_lib/auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { blockedId?: string };
  const blockedId = typeof body?.blockedId === "string" ? body.blockedId.trim() : "";
  if (!blockedId) return jsonError("blockedId is required", 400);

  const supabase = await createSupabaseUserClientOrThrow().catch(() => null);
  if (!supabase) return jsonError("You need to be logged in.", 401);
  const blockerId = await getUserIdOrThrow(supabase).catch(() => null);
  if (!blockerId) return jsonError("You need to be logged in.", 401);

  const { error } = await supabase.from("user_blocks").insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error && (error as any).code !== "23505") return jsonError(error.message, 400);
  return jsonOk({ ok: true });
}


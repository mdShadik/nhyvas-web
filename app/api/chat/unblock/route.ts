import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";
import { getUserIdOrThrow } from "@/app/api/_lib/auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { blockedId?: string };
  const blockedId = typeof body?.blockedId === "string" ? body.blockedId.trim() : "";
  if (!blockedId) return jsonError("blockedId is required", 400);

  const supabase = await getAuthenticatedClientOrNull();
  if (!supabase) return jsonError("You need to be logged in.", 401);
  const blockerId = await getUserIdOrThrow(supabase).catch(() => null);
  if (!blockerId) return jsonError("You need to be logged in.", 401);

  const { error, count } = await supabase
    .from("user_blocks")
    .delete({ count: "exact" })
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
    
  if (error) return jsonError(error.message, 400);
  if (!count) return jsonError("Block record not found.", 404);
  return jsonOk({ ok: true });
}

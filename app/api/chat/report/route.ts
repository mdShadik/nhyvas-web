import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";
import { getUserIdOrThrow } from "@/app/api/_lib/auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { reportedId?: string; reason?: string };
  const reportedId = typeof body?.reportedId === "string" ? body.reportedId.trim() : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!reportedId) return jsonError("reportedId is required", 400);
  if (!reason) return jsonError("reason is required", 400);

  const supabase = await getAuthenticatedClientOrNull();
  if (!supabase) return jsonError("You need to be logged in.", 401);
  const reporterId = await getUserIdOrThrow(supabase).catch(() => null);
  if (!reporterId) return jsonError("You need to be logged in.", 401);

  const { error } = await supabase.from("user_reports").insert({ reporter_id: reporterId, reported_id: reportedId, reason });
  if (error) return jsonError(error.message, 400);
  return jsonOk({ ok: true });
}

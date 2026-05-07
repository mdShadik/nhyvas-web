import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";
import { getUserIdOrThrow } from "@/app/api/_lib/auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | {
    fullName?: string;
    email?: string | null;
    avatarUrl?: string | null;
  };
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  if (!fullName) return jsonError("fullName is required", 400);

  const supabase = await createSupabaseUserClientOrThrow().catch(() => null);
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const userId = await getUserIdOrThrow(supabase).catch(() => null);
  if (!userId) return jsonError("You need to be logged in.", 401);

  const payload: Record<string, unknown> = {
    full_name: fullName,
    email: typeof body?.email === "string" && body.email.trim() ? body.email.trim() : null,
    role: "user",
    profile_type: "app_user",
    is_onboarded: true,
  };
  if (typeof body?.avatarUrl === "string") payload.avatar_url = body.avatarUrl;

  const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
  if (error) return jsonError(error.message, 400);
  return jsonOk({ ok: true });
}


import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";
import { getUserIdOrThrow } from "@/app/api/_lib/auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { propertyId?: string; message?: string | null };
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId.trim() : "";
  if (!propertyId) return jsonError("propertyId is required", 400);

  const supabase = await getAuthenticatedClientOrNull();
  if (!supabase) return jsonError("You need to be logged in to express interest.", 401);

  const userId = await getUserIdOrThrow(supabase).catch(() => null);
  if (!userId) return jsonError("You need to be logged in to express interest.", 401);

  const { error } = await supabase.from("property_leads").insert({
    property_id: propertyId,
    inquirer_id: userId,
    message: typeof body?.message === "string" ? body?.message : null,
  });
  if (error) return jsonError(error.message, 400);
  return jsonOk({ ok: true });
}


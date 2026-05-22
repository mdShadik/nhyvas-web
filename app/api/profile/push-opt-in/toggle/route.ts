import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientAndUserIdOrRespond } from "@/app/api/_lib/supabase";

/**
 * Toggles the global push notification opt-in for the current user.
 */
export async function POST(req: Request) {
  try {
    const authResult = await getAuthenticatedClientAndUserIdOrRespond();
    if ("status" in authResult) return authResult;
    const { client: supabase, userId } = authResult;

    const body = await req.json().catch(() => null);
    if (!body) return jsonError("Invalid JSON body.", 400);

    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return jsonError("enabled boolean is required.", 400);
    }

    const { error } = await supabase
      .from("profiles")
      .update({ push_opt_in: enabled })
      .eq("id", userId);

    if (error) return jsonError(error.message, 400);

    return jsonOk({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Toggle failed.";
    return jsonError(message, 500);
  }
}

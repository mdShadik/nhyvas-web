import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientAndUserIdOrRespond } from "@/app/api/_lib/supabase";

export async function POST(req: Request) {
  try {
    const authResult = await getAuthenticatedClientAndUserIdOrRespond();
    if ("status" in authResult) return authResult;
    const { client: supabase, userId } = authResult;

    const body = await req.json().catch(() => null);
    if (!body) return jsonError("Invalid JSON body.", 400);

    const { legalName, phoneNumber, houseImageUrl } = body;

    if (!legalName || !phoneNumber || !houseImageUrl) {
      return jsonError("Missing required fields.", 400);
    }

    // 1. Store verification proof
    const { error: verifyError } = await supabase
      .from("landlord_verifications")
      .upsert({
        user_id: userId,
        legal_name: legalName,
        phone_number: phoneNumber,
        house_image_url: houseImageUrl,
      }, { onConflict: "user_id" });

    if (verifyError) return jsonError(verifyError.message, 400);

    // 2. Update profile verification flag
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ landlord_verified: true })
      .eq("id", userId);

    if (profileError) return jsonError(profileError.message, 400);

    return jsonOk({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed.";
    return jsonError(message, 500);
  }
}

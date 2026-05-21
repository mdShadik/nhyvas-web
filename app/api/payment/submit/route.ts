import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientAndUserIdOrRespond } from "@/app/api/_lib/supabase";

export async function POST(req: Request) {
  try {
    const authResult = await getAuthenticatedClientAndUserIdOrRespond();
    if ("status" in authResult) return authResult;
    const { client: supabase, userId } = authResult;

    const body = await req.json().catch(() => null);
    if (!body) return jsonError("Invalid JSON body.", 400);

    const { listingId, transactionId, remarks, screenshotUrl } = body;

    if (!listingId) return jsonError("listingId is required", 400);
    if (!screenshotUrl) return jsonError("screenshotUrl is required", 400);

    // 1. Create listing_payments record
    const { error: paymentError } = await supabase
      .from("listing_payments")
      .insert({
        listing_id: listingId,
        user_id: userId,
        transaction_id: transactionId || null,
        remarks: remarks || null,
        screenshot_url: screenshotUrl,
        status: "pending",
      });

    if (paymentError) return jsonError(paymentError.message, 400);

    // 2. Update listing status to payment_verification
    const { error: listingError } = await supabase
      .from("listing_moderation_queue")
      .update({ status: "payment_verification" })
      .eq("id", listingId)
      .eq("listed_by", userId);

    if (listingError) return jsonError(listingError.message, 400);

    return jsonOk({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit payment.";
    return jsonError(message, 500);
  }
}

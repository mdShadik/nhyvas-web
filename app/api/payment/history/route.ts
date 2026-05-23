import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getAuthenticatedClientAndUserIdOrRespond } from "@/app/api/_lib/supabase";

export async function GET() {
  try {
    const authResult = await getAuthenticatedClientAndUserIdOrRespond();
    if ("status" in authResult) return authResult;
    const { client: supabase, userId } = authResult;

    const { data: payments, error } = await supabase
      .from("listing_payments")
      .select(`
        *,
        listing:listing_moderation_queue(id, property_title, price, currency_code, approval_fee_amount),
        invoice:invoices(*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return jsonError(error.message, 400);

    return jsonOk({ items: payments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch payment history.";
    return jsonError(message, 500);
  }
}

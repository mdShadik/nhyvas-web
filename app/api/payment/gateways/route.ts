import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST() {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("payment_gateways")
      .select("title, qr_code_url")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return jsonError(error.message, 400);
    return jsonOk({ row: data || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load payment gateway.";
    return jsonError(message, 500);
  }
}

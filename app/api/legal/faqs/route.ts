import { jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST() {
  const supabase = createSupabasePublicClient();
  try {
    const { data, error } = await supabase
      .from("app_faqs")
      .select("id, question, answer_html, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (!error) return jsonOk({ rows: data ?? [] });
  } catch {
    // ignore
  }
  return jsonOk({ rows: [] });
}


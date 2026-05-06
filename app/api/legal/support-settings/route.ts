import { jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST() {
  const supabase = createSupabasePublicClient();
  try {
    const { data, error } = await supabase.from("app_support_settings").select("whatsapp_url").eq("id", 1).maybeSingle();
    if (!error) {
      const whatsappUrl =
        data && typeof (data as any).whatsapp_url === "string" && (data as any).whatsapp_url.trim()
          ? (data as any).whatsapp_url
          : null;
      return jsonOk({ whatsappUrl });
    }
  } catch {
    // ignore
  }
  return jsonOk({ whatsappUrl: null });
}


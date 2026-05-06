import { jsonOk } from "@/app/api/_lib/response";
import { createSupabasePublicClient } from "@/app/api/_lib/supabaseClients";

export async function POST() {
  const supabase = createSupabasePublicClient();

  try {
    const { data, error } = await supabase
      .from("app_legal_documents")
      .select("slug, content_html, updated_at")
      .eq("slug", "terms_and_conditions")
      .maybeSingle();
    if (!error && data) {
      const html = typeof (data as any).content_html === "string" ? (data as any).content_html : "";
      if (html.trim()) {
        return jsonOk({
          html,
          updatedAt: typeof (data as any).updated_at === "string" ? (data as any).updated_at : null,
        });
      }
    }
  } catch {
    // fall through
  }

  return jsonOk({
    html: `
      <h2>Terms &amp; Conditions</h2>
      <p>Terms content is not published yet from the admin portal.</p>
      <p>Please add terms HTML in admin settings and try again.</p>
    `,
    updatedAt: null,
  });
}


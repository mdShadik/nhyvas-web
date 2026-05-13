import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { env } from "@/lib/env";
import { getAuthenticatedClientOrRespond } from "@/app/api/_lib/supabase";

export async function POST(req: Request) {
  try {
    const supabase = await getAuthenticatedClientOrRespond();
    if (supabase instanceof Response) {
      return supabase;
    }

    // Get current session from the authenticated client
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return jsonError("No active session for upload", 401);

    const formData = await req.formData();
    
    const uploadResponse = await fetch(env.r2UploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        // Note: Do NOT set Content-Type header here.
        // fetch will automatically set it to multipart/form-data with the correct boundary
        // when you pass FormData as the body.
      },
      body: formData,
    });

    const payload = await uploadResponse.json().catch(() => null);
    if (!uploadResponse.ok) {
      return jsonError(payload?.message ?? `Status ${uploadResponse.status}`, 400);
    }

    return jsonOk({ data: payload.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload proxy failed.";
    return jsonError(message, 500);
  }
}

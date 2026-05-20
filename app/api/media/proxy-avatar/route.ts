import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { env } from "@/lib/env";
import { getAuthenticatedClientOrRespond } from "@/app/api/_lib/supabase";

export async function POST(req: Request) {
  try {
    const supabase = await getAuthenticatedClientOrRespond();
    if (supabase instanceof Response) return supabase;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return jsonError("No active session for upload", 401);

    const body = (await req.json().catch(() => null)) as null | { url?: string };
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    if (!url) return jsonError("url is required", 400);
    if (!/^https?:\/\//i.test(url)) return jsonError("url must be http(s)", 400);

    // Fetch the remote image (Google avatar, etc.)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        Accept: "image/*",
        // Some providers behave better with a UA.
        "User-Agent": "nhyvas-web-avatar-proxy/1.0",
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      return jsonError(`Failed to fetch remote image (status ${response.status})`, 400);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return jsonError(`Remote URL is not an image (content-type: ${contentType || "unknown"})`, 400);
    }

    const blob = await response.blob();
    // Limit to 2MB to avoid abuse
    if (blob.size > 2 * 1024 * 1024) {
      return jsonError("Avatar image too large (max 2MB).", 400);
    }

    const ext =
      contentType.includes("png")
        ? "png"
        : contentType.includes("webp")
          ? "webp"
          : contentType.includes("gif")
            ? "gif"
            : "jpg";

    const formData = new FormData();
    formData.append("folder", "avatars");
    formData.append("file", blob, `avatar-${Date.now()}.${ext}`);

    // Upload to R2 via existing authenticated proxy endpoint
    const uploadResponse = await fetch(env.r2UploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    const payload = await uploadResponse.json().catch(() => null);
    if (!uploadResponse.ok) {
      return jsonError(payload?.message ?? `Upload failed (status ${uploadResponse.status})`, 400);
    }

    const publicUrl = (payload?.data?.publicUrl ?? payload?.data?.url ?? "").toString().trim();
    const objectPath = (payload?.data?.objectPath ?? payload?.data?.path ?? "").toString().trim();
    if (!publicUrl) return jsonError("Upload response missing publicUrl", 500);

    return jsonOk({ url: publicUrl, objectPath });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to process avatar", 500);
  }
}

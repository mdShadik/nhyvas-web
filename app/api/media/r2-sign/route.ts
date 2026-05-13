import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { env } from "@/lib/env";
import { getAuthenticatedClientOrNull } from "@/app/api/_lib/supabase";

type SignedUploadResponse = {
  uploadUrl: string;
  publicUrl: string;
  objectPath: string;
  expiresInSeconds: number;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | {
    fileExt?: string;
    contentType?: string;
    folder?: string;
    userId?: string;
  };

  const folder = typeof body?.folder === "string" ? body.folder.trim() : "";
  if (!folder) return jsonError("folder is required", 400);

  const fileExt = typeof body?.fileExt === "string" ? body.fileExt.trim() : "bin";
  const contentType = typeof body?.contentType === "string" ? body.contentType.trim() : "application/octet-stream";

  const supabase = await getAuthenticatedClientOrNull();
  if (!supabase) return jsonError("You need to be logged in.", 401);

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return jsonError("No active session for upload", 401);

  const signedResponse = await fetch(env.r2SignUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      fileExt,
      contentType,
      folder,
      userId: typeof body?.userId === "string" ? body.userId : undefined,
    }),
  });

  const signedPayload = await signedResponse.json().catch(() => null);
  if (!signedResponse.ok || !signedPayload?.data?.uploadUrl) {
    return jsonError(signedPayload?.message ?? `Status ${signedResponse.status}`, 400);
  }

  return jsonOk({ data: signedPayload.data as SignedUploadResponse });
}


import { env } from "@/lib/env";
import { requestJson } from "@/services/apiService/http";

type SignedUploadResponse = {
  uploadUrl: string;
  publicUrl: string;
  objectPath: string;
  expiresInSeconds: number;
};

type ProxyUploadResponse = {
  publicUrl?: string | null;
  url?: string | null;
  objectPath?: string | null;
  path?: string | null;
};

type UploadToR2Input = {
  file: File;
  folder: string;
  userId?: string;
};

export async function uploadToR2(input: UploadToR2Input): Promise<string> {
  // Prefer proxy upload to avoid R2/S3 CORS issues with browser PUTs to presigned URLs.
  // If NEXT_PUBLIC_R2_UPLOAD_URL isn't configured, fall back to presigned PUT.
  if (env.r2UploadUrl && env.r2UploadUrl.trim().length > 0) {
    const form = new FormData();
    form.append("file", input.file);
    form.append("folder", input.folder);
    if (typeof input.userId === "string" && input.userId.trim()) form.append("userId", input.userId.trim());

    const { data } = await requestJson<{ data: ProxyUploadResponse }>("/api/media/r2-upload", {
      method: "POST",
      body: form as any,
      // Let fetch set multipart boundary.
      headers: {},
    } as any);

    const objectPath = (data?.objectPath ?? data?.path ?? "").toString().replace(/^\/+/, "");
    const resolvedPublicUrl = (data?.publicUrl ?? data?.url ?? "").toString().trim();

    if (resolvedPublicUrl) return resolvedPublicUrl;
    if (objectPath) return `${env.r2PublicBaseUrl.replace(/\/+$/, "")}/${objectPath}`;
    throw new Error("R2 upload response missing publicUrl/objectPath.");
  }

  const name = typeof input.file.name === "string" ? input.file.name : "file.bin";
  const fileExt = name.split(".").pop()?.toLowerCase() ?? "bin";
  const contentType = input.file.type || "application/octet-stream";

  const { data: signedData } = await requestJson<{ data: SignedUploadResponse }>("/api/media/r2-sign", {
    method: "POST",
    body: JSON.stringify({
      fileExt,
      contentType,
      folder: input.folder,
      userId: input.userId,
    }),
  });

  const putRes = await fetch(signedData.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: input.file,
  });
  if (!putRes.ok) {
    const text = await putRes.text().catch(() => "");
    throw new Error(`R2 upload failed (${putRes.status}): ${text}`);
  }

  const objectPath = (signedData.objectPath ?? "").replace(/^\/+/, "");
  const fallbackPublicUrl = objectPath
    ? `${env.r2PublicBaseUrl.replace(/\/+$/, "")}/${objectPath}`
    : null;
  const resolvedPublicUrl = signedData.publicUrl ?? fallbackPublicUrl;

  if (!resolvedPublicUrl) {
    throw new Error("R2 sign response missing both publicUrl and objectPath.");
  }

  return resolvedPublicUrl;
}

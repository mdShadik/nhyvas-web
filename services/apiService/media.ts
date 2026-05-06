import { env } from "@/lib/env";
import { requestJson } from "@/services/apiService/http";

type SignedUploadResponse = {
  uploadUrl: string;
  publicUrl: string;
  objectPath: string;
  expiresInSeconds: number;
};

type UploadToR2Input = {
  file: File;
  folder: string;
  userId?: string;
};

export async function uploadToR2(input: UploadToR2Input): Promise<string> {
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

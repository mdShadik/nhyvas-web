import { useState } from "react";

type UseR2UploadOptions = {
  folder?: string;
  onSuccess?: (publicUrl: string) => void;
  onError?: (error: Error) => void;
};

export function useR2Upload(options?: UseR2UploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const folder = options?.folder || "uploads";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      // Upload file directly through our backend proxy
      const uploadRes = await fetch("/api/media/r2-upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      
      if (!uploadRes.ok || !uploadData.data?.publicUrl) {
        throw new Error(uploadData.error || uploadData.message || "Failed to upload to storage");
      }

      const { publicUrl } = uploadData.data;

      options?.onSuccess?.(publicUrl);
      return publicUrl;
    } catch (err: any) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      options?.onError?.(errorObj);
      throw errorObj;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, error };
}

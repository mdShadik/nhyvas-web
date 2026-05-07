"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { useR2Upload } from "@/hooks/useR2Upload";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  onAvatarChange: (url: string) => void;
  folder?: string;
  className?: string;
}

export function AvatarUpload({
  currentAvatarUrl,
  onAvatarChange,
  folder = "avatars",
  className = "",
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading, error } = useR2Upload({
    folder,
    onSuccess: (publicUrl) => {
      onAvatarChange(publicUrl);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadFile(file);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <label
        htmlFor="avatarUploadInput"
        className="group relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[var(--border)] bg-[var(--color-bg-input)] transition hover:border-[var(--accent)]"
      >
        {currentAvatarUrl ? (
          <>
            <Image
              src={currentAvatarUrl}
              alt="Avatar"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 112px, 112px"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-[var(--color-text-secondary)] group-hover:text-[var(--accent)]">
            <Camera className="mb-1 h-6 w-6" />
            <span className="text-xs font-semibold">Upload</span>
          </div>
        )}
        
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface)]/80 backdrop-blur-sm">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          </div>
        )}
      </label>
      
      <input
        ref={fileInputRef}
        id="avatarUploadInput"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      
      {error && (
        <p className="mt-2 text-xs text-red-500">
          {error.message}
        </p>
      )}
    </div>
  );
}

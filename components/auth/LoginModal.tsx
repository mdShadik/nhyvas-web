"use client";

import { useMemo } from "react";
import { createPortal } from "react-dom";
import { LoginCard } from "@/components/auth/LoginCard";

type Props = {
  open: boolean;
  onClose: () => void;
  nextUrl?: string | null;
  title?: string;
  description?: string;
};

export function LoginModal({ open, onClose, nextUrl, title, description }: Props) {
  const mounted = typeof window !== "undefined";
  const safeNext = useMemo(() => {
    const raw = (nextUrl ?? "").trim();
    if (!raw) return "";
    return raw.startsWith("/") ? raw : "";
  }, [nextUrl]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close login"
      />
      <div className="relative mx-auto flex min-h-full w-full max-w-2xl items-center justify-center px-4 py-10">
        <LoginCard
          nextUrl={safeNext}
          onClose={onClose}
          title={title}
          description={description}
        />
      </div>
    </div>,
    document.body
  );
}


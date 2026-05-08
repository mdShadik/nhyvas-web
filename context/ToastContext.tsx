"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ToastVariant = "default" | "success" | "error";

export type ToastItem = {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
  durationMs: number;
};

type ToastInput = {
  id?: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastContextValue = {
  toasts: ToastItem[];
  showToast: (toast: ToastInput) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function generateId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => setToasts([]), []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = toast.id ?? generateId();
      const durationMsRaw = toast.durationMs;
      const durationMs = Number.isFinite(durationMsRaw as number)
        ? Math.max(1500, Math.min(Number(durationMsRaw), 15000))
        : 4500;

      const item: ToastItem = {
        id,
        title: toast.title,
        message: toast.message,
        variant: toast.variant ?? "default",
        durationMs,
      };

      setToasts((prev) => {
        const next = [item, ...prev].slice(0, 4);
        return next;
      });

      window.setTimeout(() => {
        dismissToast(id);
      }, durationMs);
    },
    [dismissToast]
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, showToast, dismissToast, clearToasts }),
    [toasts, showToast, dismissToast, clearToasts]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return ctx;
}

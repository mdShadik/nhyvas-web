"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive";
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children?: ReactNode;
  className?: string;
};

export function Dialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "default",
  busy = false,
  onClose,
  onConfirm,
  children,
  className,
}: DialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div className={cn("fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6", className)}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300" 
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      
      {/* Dialog content */}
      <div 
        className="relative w-full max-w-lg border border-white/20 bg-white/5 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-300 sm:p-8"
        style={{ clipPath: "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))" }}
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="dialog-title"
      >
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-text-tertiary transition-colors hover:text-text-primary sm:right-6 sm:top-6"
          disabled={busy}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-2">
          <h2 id="dialog-title" className="text-xl font-extrabold text-text-primary sm:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className="text-sm leading-relaxed text-text-secondary">
              {description}
            </p>
          ) : null}
        </div>

        {children ? (
          <div className="mt-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {children}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={busy}
            className="h-11 border-white/10 bg-white/5 font-semibold sm:h-10 sm:min-w-25"
            style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}
          >
            {cancelLabel}
          </Button>
          <Button 
            variant={confirmVariant} 
            onClick={onConfirm} 
            disabled={busy}
            className={cn(
              "h-11 font-bold shadow-[0_0_20px_rgba(99,102,241,0.2)] sm:h-10 sm:min-w-30",
              confirmVariant === "default" && "bg-linear-to-r from-primary-500 to-tertiary-500 text-white"
            )}
            style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                {confirmLabel}
              </span>
            ) : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

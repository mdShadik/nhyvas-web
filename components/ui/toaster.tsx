"use client";

import { X } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export function Toaster() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="nhyvas-toast-viewport" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={[
            "nhyvas-toast",
            toast.variant === "success"
              ? "is-success"
              : toast.variant === "error"
              ? "is-error"
              : "is-default",
          ].join(" ")}
        >
          <div className="nhyvas-toast-body">
            {toast.title ? <div className="nhyvas-toast-title">{toast.title}</div> : null}
            <div className="nhyvas-toast-message">{toast.message}</div>
          </div>

          <button
            type="button"
            className="nhyvas-toast-close"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}


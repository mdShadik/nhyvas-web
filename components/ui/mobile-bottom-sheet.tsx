"use client";

import type { ReactNode } from "react";
import { Sheet } from "react-modal-sheet";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
};

export function MobileBottomSheet({
  open,
  title,
  description,
  onClose,
  showCloseButton = false,
  children,
  className,
}: Props) {
  return (
    <Sheet
      isOpen={open}
      onClose={onClose}
      snapPoints={[0, 0.6, 1]}
      initialSnap={1}
      className={cn("nhyvas-mobile-sheet", className)}
    >
      <Sheet.Backdrop
        onTap={onClose}
        className="bg-slate-950/55!"
      />

      <Sheet.Container
        className={cn(
          "bg-bg-page!",
          "border! border-border! border-b-0!",
          "rounded-t-[28px]!",
          "shadow-2xl!",
          "overflow-hidden!"
        )}
      >
        <Sheet.Header
          className={cn(
            "bg-bg-page!",
            "border-b! !borde-border",
            "px-4! pt-2.5! pb-3!"
          )}
        >
          {/* Drag Indicator */}
          <div
            className={cn(
              "mx-auto mb-2.5",
              "h-1.25px w-11 rounded-full",
              "bg-bg-page"
            )}
          />

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate p-3 pt-0 text-base font-extrabold text-text-primary">
                {title}
              </div>

              {description ? (
                <div className="mt-0.5 line-clamp-2 p-2 pt-0 text-sm text-text-secondary">
                  {description}
                </div>
              ) : null}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className={cn(
                  "m-3 inline-flex h-10 w-10 items-center justify-center",
                  "rounded-2xl",
                  "border border-border",
                  "bg-bg-input",
                  "text-text-primary",
                  "transition-colors",
                  "hover:bg-muted"
                )}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </Sheet.Header>

        <Sheet.Content
          className="bg-linear-to-br! dark:from-bg-page dark:via-primary-900/10 dark:to-tertiary-500/20 to-tertiary-50"
        >
          <div className="px-4 pb-6">
            {children}
          </div>
        </Sheet.Content>
      </Sheet.Container>
    </Sheet>
  );
}
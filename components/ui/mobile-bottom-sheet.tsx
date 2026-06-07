"use client";

import { useRef, type ReactNode } from "react";
import { Sheet } from "react-modal-sheet";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  title?: React.ReactNode;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
  modal?: boolean;
  disableDismiss?: boolean;
  snapPoints?: number[];
  initialSnap?: number;
  minSnap?: number;
};

export function MobileBottomSheet({
  open,
  title,
  description,
  onClose,
  showCloseButton = false,
  children,
  className,
  modal = true,
  disableDismiss = false,
  snapPoints = [0, 0.6, 1],
  initialSnap = 1,
  minSnap = 0,
}: Props) {
  const sheetRef = useRef<{ snapTo?: (index: number) => void } | null>(null);

  return (
    <Sheet
      ref={sheetRef}
      isOpen={open}
      onClose={onClose}
      disableDismiss={disableDismiss}
      snapPoints={snapPoints}
      initialSnap={initialSnap}
      onSnap={(index) => {
        // If we snap to a point below minSnap (usually 0), snap back to minSnap
        const snapped = snapPoints[index];
        if (snapped != null && snapped < minSnap) {
          const minIndex = snapPoints.findIndex((p) => p >= minSnap);
          if (minIndex !== -1) {
            sheetRef.current?.snapTo?.(minIndex);
          }
        }
      }}
      className={cn("nhyvas-mobile-sheet", className, !modal && "pointer-events-none!")}
    >
      {modal && (
        <Sheet.Backdrop
          onTap={onClose}
          className="bg-slate-950/40! backdrop-blur-[1px]!"
        />
      )}

      <Sheet.Container
        className={cn(
          "bg-bg-page!",
          "border! border-border! border-b-0!",
          "rounded-t-[28px]!",
          "shadow-2xl!",
          "overflow-hidden!",
          "will-change-transform!",
          !modal && "pointer-events-auto!"
        )}
      >
        <Sheet.Header
          className={cn(
            "bg-bg-page!",
            "border-b! border-border/50!",
            "px-4! pt-2.5! pb-3!"
          )}
        >
          {/* Drag Indicator */}
          <div
            className={cn(
              "mx-auto mb-2.5",
              "h-1.5 w-12 rounded-full",
              "bg-secondary-200 dark:bg-secondary-800"
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
          className="bg-bg-page!"
        >
            {children}
        </Sheet.Content>
      </Sheet.Container>
    </Sheet>
  );
}

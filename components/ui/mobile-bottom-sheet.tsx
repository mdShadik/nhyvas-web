"use client";

import type { ReactNode } from "react";
import {Sheet} from "react-modal-sheet";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function MobileBottomSheet({ open, title, description, onClose, children, className }: Props) {
  return (
    <Sheet
      isOpen={open}
      onClose={onClose}
      // Must include 0 (fully closed) and 1 (fully open).
      snapPoints={[0, 0.6, 1]}
      initialSnap={1}
      className={className ? `nhyvas-mobile-sheet ${className}` : "nhyvas-mobile-sheet"}
    >
      <Sheet.Backdrop onTap={onClose} className="nhyvas-mobile-sheet-backdrop" />
      <Sheet.Container className="nhyvas-mobile-sheet-container">
        <Sheet.Header className="nhyvas-mobile-sheet-header">
          <div className="nhyvas-mobile-sheet-drag-indicator" />
          <div className="nhyvas-mobile-sheet-title-row">
            <div className="min-w-0">
              <div className="truncate text-base font-extrabold text-text-primary">{title}</div>
              {description ? (
                <div className="mt-0.5 line-clamp-2 text-sm text-text-secondary">{description}</div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-bg-input text-text-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </Sheet.Header>

        <Sheet.Content className="nhyvas-mobile-sheet-content">
          <div className="px-4 pb-6">{children}</div>
        </Sheet.Content>
      </Sheet.Container>
    </Sheet>
  );
}

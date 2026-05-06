import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
}: DialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="ui-dialog-root" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <button type="button" className="ui-dialog-backdrop" onClick={onClose} aria-label="Close" />
      <div className="ui-dialog">
        <div className="ui-dialog-header">
          <h2 id="dialog-title" className="ui-dialog-title">
            {title}
          </h2>
          {description ? <p className="ui-dialog-description">{description}</p> : null}
        </div>
        {children ? <div className="ui-dialog-body">{children}</div> : null}
        <div className={cn("ui-dialog-footer", busy && "is-busy")}>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={busy}>
            {busy ? "Please wait..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

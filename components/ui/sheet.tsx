import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SheetProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function Sheet({ open, title, description, onClose, children, className }: SheetProps) {
  if (!open) {
    return null;
  }

  return (
    <>
      <button type="button" className="ui-sheet-backdrop" onClick={onClose} aria-label="Close panel" />
      <aside className={cn("ui-sheet", className)}>
        <div className="ui-sheet-header">
          <div>
            <h2 className="ui-sheet-title">{title}</h2>
            {description ? <p className="ui-sheet-description">{description}</p> : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
            <X size={18} />
          </Button>
        </div>
        <div className="ui-sheet-body">{children}</div>
      </aside>
    </>
  );
}

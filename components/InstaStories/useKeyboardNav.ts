// useKeyboardNav.ts
import { useEffect } from "react";

interface UseKeyboardNavOptions {
  enabled: boolean;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onTogglePause: () => void;
}

export function useKeyboardNav({
  enabled,
  onNext,
  onPrev,
  onClose,
  onTogglePause,
}: UseKeyboardNavOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          onNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          onPrev();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case " ":
          e.preventDefault();
          onTogglePause();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onNext, onPrev, onClose, onTogglePause]);
}
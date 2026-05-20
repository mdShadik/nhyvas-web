// SlideUpPanel.tsx
import React, { useRef, useCallback, useEffect } from "react";
import styles from "./styles.module.css";

interface SlideUpPanelProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const SlideUpPanel: React.FC<SlideUpPanelProps> = ({ isVisible, onClose, children }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const panel = panelRef.current;
    if (!panel) return;

    // Only allow drag from the handle or when scrolled to top
    const contentEl = panel.querySelector(`.${styles.slideUpPanelContent}`) as HTMLElement;
    const isAtTop = !contentEl || contentEl.scrollTop <= 0;
    const isHandle = target.classList.contains(styles.slideUpPanelHandle);

    if (!isHandle && !isAtTop) return;

    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || !panelRef.current) return;

    const deltaY = e.touches[0].clientY - startYRef.current;
    if (deltaY < 0) return; // Only allow downward drag

    currentYRef.current = deltaY;
    panelRef.current.style.transform = `translateY(${deltaY}px)`;
    panelRef.current.style.transition = "none";
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current || !panelRef.current) return;

    isDraggingRef.current = false;
    panelRef.current.style.transition = "";
    panelRef.current.style.transform = "";

    if (currentYRef.current > 100) {
      onClose();
    }

    currentYRef.current = 0;
  }, [onClose]);

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isVisible]);

  return (
    <>
      <div
        className={`${styles.slideUpOverlay} ${isVisible ? styles.slideUpOverlayVisible : ""}`}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={`${styles.slideUpPanel} ${isVisible ? styles.slideUpPanelVisible : ""}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.slideUpPanelHandle} />
        <button
          className={styles.slideUpPanelClose}
          onClick={onClose}
          aria-label="Close panel"
          type="button"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className={styles.slideUpPanelContent}>{children}</div>
      </div>
    </>
  );
};

export default React.memo(SlideUpPanel);
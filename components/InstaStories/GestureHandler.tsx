// GestureHandler.tsx
import React, { useRef, useCallback, useState } from "react";
import styles from "./styles.module.css";

interface GestureHandlerProps {
  children: React.ReactNode;
  onSwipeDown?: () => void;
  onSwipeUp?: () => void;
  onTapLeft: () => void;
  onTapRight: () => void;
  onLongPressStart: () => void;
  onLongPressEnd: () => void;
  enableGestures?: boolean;
  swipeDownToClose?: boolean;
  swipeUpToAction?: boolean;
  swipeThreshold?: number;
}

const GestureHandler: React.FC<GestureHandlerProps> = ({
  children,
  onSwipeDown,
  onSwipeUp,
  onTapLeft,
  onTapRight,
  onLongPressStart,
  onLongPressEnd,
  enableGestures = true,
  swipeDownToClose = true,
  swipeUpToAction = true,
  swipeThreshold = 80,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const isDraggingRef = useRef<boolean>(false);
  // ✅ FIX: Pass `null` and update the type to include `| null`
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressingRef = useRef<boolean>(false);
  const hasMoveRef = useRef<boolean>(false);

  const [dragOffset, setDragOffset] = useState({ y: 0, active: false });

  // Helper to safely clear the timer
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      hasMoveRef.current = false;
      isDraggingRef.current = false;

      clearLongPressTimer();
      longPressTimerRef.current = setTimeout(() => {
        isLongPressingRef.current = true;
        onLongPressStart();
      }, 400);
    },
    [onLongPressStart, clearLongPressTimer]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enableGestures) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        hasMoveRef.current = true;
        clearLongPressTimer();

        if (isLongPressingRef.current) {
          isLongPressingRef.current = false;
          onLongPressEnd();
        }
      }

      // Vertical drag for swipe gestures
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
        isDraggingRef.current = true;

        if (deltaY > 0 && swipeDownToClose) {
          setDragOffset({ y: deltaY * 0.6, active: true });
        } else if (deltaY < 0 && swipeUpToAction) {
          setDragOffset({ y: deltaY * 0.3, active: true });
        }
      }
    },
    [enableGestures, swipeDownToClose, swipeUpToAction, onLongPressEnd, clearLongPressTimer]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      clearLongPressTimer();

      if (isLongPressingRef.current) {
        isLongPressingRef.current = false;
        onLongPressEnd();
        return;
      }

      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setDragOffset({ y: 0, active: false });

        const touch = e.changedTouches[0];
        const deltaY = touch.clientY - touchStartRef.current.y;

        if (deltaY > swipeThreshold && swipeDownToClose && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < -swipeThreshold && swipeUpToAction && onSwipeUp) {
          onSwipeUp();
        }
        return;
      }

      if (!hasMoveRef.current) {
        // It's a tap
        const touch = e.changedTouches[0];
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const tapX = touch.clientX - rect.left;
        const halfWidth = rect.width / 2;

        if (tapX < halfWidth) {
          onTapLeft();
        } else {
          onTapRight();
        }
      }
    },
    [
      onSwipeDown,
      onSwipeUp,
      onTapLeft,
      onTapRight,
      onLongPressEnd,
      swipeDownToClose,
      swipeUpToAction,
      swipeThreshold,
      clearLongPressTimer,
    ]
  );

  // Mouse events for desktop
  const mouseDownRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const mouseHasMoveRef = useRef<boolean>(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      mouseDownRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      mouseHasMoveRef.current = false;

      clearLongPressTimer();
      longPressTimerRef.current = setTimeout(() => {
        isLongPressingRef.current = true;
        onLongPressStart();
      }, 400);
    },
    [onLongPressStart, clearLongPressTimer]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      clearLongPressTimer();

      if (isLongPressingRef.current) {
        isLongPressingRef.current = false;
        onLongPressEnd();
        return;
      }

      if (!mouseHasMoveRef.current) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const tapX = e.clientX - rect.left;
        const halfWidth = rect.width / 2;

        if (tapX < halfWidth) {
          onTapLeft();
        } else {
          onTapRight();
        }
      }
    },
    [onTapLeft, onTapRight, onLongPressEnd, clearLongPressTimer]
  );

  const handleMouseMove = useCallback(() => {
    mouseHasMoveRef.current = true;
    if (isLongPressingRef.current) return;
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handleMouseLeave = useCallback(() => {
    clearLongPressTimer();
    if (isLongPressingRef.current) {
      isLongPressingRef.current = false;
      onLongPressEnd();
    }
  }, [onLongPressEnd, clearLongPressTimer]);

  const transformStyle: React.CSSProperties = dragOffset.active
    ? {
        transform: `translateY(${dragOffset.y}px) scale(${
          1 - Math.abs(dragOffset.y) * 0.0005
        })`,
        opacity: 1 - Math.abs(dragOffset.y) * 0.002,
        borderRadius: dragOffset.y > 20 ? "16px" : undefined,
      }
    : {};

  return (
    <div
      ref={containerRef}
      className={`${styles.gestureContainer} ${
        dragOffset.active ? styles.gestureContainerDragging : ""
      }`}
      style={transformStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

export default React.memo(GestureHandler);
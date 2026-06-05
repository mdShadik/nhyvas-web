"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  type Variants,
} from "motion/react";
import {
  Sparkles,
  Search,
  X,
  ArrowRight,
  Loader2,
  Mic,
  History,
  TrendingUp,
  Lightbulb,
  BotMessageSquare,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Draggable, { type DraggableData, type DraggableEvent } from "react-draggable";
import { useTranslation } from "react-i18next";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type AiSearchSuggestion = {
  id: string;
  label: string;
  icon?: "history" | "trending" | "suggestion";
};

export interface AiSearchProps {
  onSearch: (query: string) => void | Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholders?: string[];
  suggestions?: AiSearchSuggestion[];
  isSearching?: boolean;
  query?: string;
  onQueryChange?: (query: string) => void;
  buttonPosition?: "bottom-right" | "bottom-left" | "bottom-center";
  buttonLabel?: string;
  buttonClassName?: string;
  panelClassName?: string;
  id?: string;
  minQueryLength?: number;
  showMic?: boolean;
  onMicPress?: () => void;
  disabled?: boolean;
  aiRemainingCredit?: number;
  children?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Variants                                                           */
/* ------------------------------------------------------------------ */

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 320, damping: 26 },
  },
  exit: {
    opacity: 0,
    y: 8,
    filter: "blur(4px)",
    transition: { duration: 0.1 },
  },
};

const pulseRingVariants: Variants = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.5, 1.8],
    opacity: [0.35, 0.12, 0],
    transition: { duration: 2.4, repeat: Infinity, ease: "easeOut" },
  },
};

/* ------------------------------------------------------------------ */
/*  Animated Placeholder                                               */
/* ------------------------------------------------------------------ */

function AnimatedPlaceholder({ placeholders }: { placeholders: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (placeholders.length <= 1) return;
    const id = setInterval(
      () => setIndex((p) => (p + 1) % placeholders.length),
      3200
    );
    return () => clearInterval(id);
  }, [placeholders]);

  const text = placeholders[index] ?? "";

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={text}
        initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
        transition={{ duration: 0.25 }}
        className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[15px] font-medium text-placeholder select-none"
      >
        {text}
      </motion.span>
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Suggestion icon                                                    */
/* ------------------------------------------------------------------ */

function SuggestionIcon({ type }: { type?: AiSearchSuggestion["icon"] }) {
  switch (type) {
    case "history":
      return <History className="h-3.5 w-3.5" />;
    case "trending":
      return <TrendingUp className="h-3.5 w-3.5" />;
    case "suggestion":
      return <Lightbulb className="h-3.5 w-3.5" />;
    default:
      return <Search className="h-3.5 w-3.5" />;
  }
}

/* ------------------------------------------------------------------ */
/*  Trail Sparks                                                       */
/* ------------------------------------------------------------------ */

function TrailSparks({
  originX,
  originY,
  active,
}: {
  originX: number;
  originY: number;
  active: boolean;
}) {
  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[73] overflow-hidden">
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const radius = 20 + i * 8;
        const size = 2 + Math.random() * 3;

        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              left: originX,
              top: originY,
              background:
                i % 2 === 0
                  ? "var(--color-primary-400)"
                  : "var(--color-tertiary-400)",
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius - 60,
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 0.5,
              delay: i * 0.025,
              ease: "easeOut",
            }}
          />
        );
      })}

      <motion.div
        className="absolute rounded-full border border-primary-400/50"
        style={{
          width: 40,
          height: 40,
          left: originX - 20,
          top: originY - 20,
        }}
        initial={{ scale: 0.3, opacity: 0.8 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ghost Trail                                                        */
/* ------------------------------------------------------------------ */

function GhostTrail({
  originX,
  originY,
  active,
}: {
  originX: number;
  originY: number;
  active: boolean;
}) {
  if (!active) return null;

  const targetX =
    typeof window !== "undefined" ? window.innerWidth / 2 : 200;
  const targetY =
    typeof window !== "undefined" ? window.innerHeight * 0.15 + 100 : 200;
  const fdx = originX - targetX;
  const fdy = originY - targetY;

  const panelW = Math.min(
    520,
    typeof window !== "undefined" ? window.innerWidth - 32 : 520
  );

  const ghosts = [
    { delay: 0.02, opacity: [0, 0.4, 0.2, 0], scale: [0.06, 0.5, 0.95, 1], rotate: [-15, -90, -180, -200], dur: 0.6, border: "border-primary-400/20", bg: "bg-primary-500/8" },
    { delay: 0.06, opacity: [0, 0.3, 0.12, 0], scale: [0.04, 0.35, 0.85, 1], rotate: [-10, -60, -140, -170], dur: 0.65, border: "border-tertiary-400/15", bg: "bg-tertiary-500/5" },
    { delay: 0.1, opacity: [0, 0.2, 0.08, 0], scale: [0.03, 0.25, 0.7, 1], rotate: [-5, -40, -100, -130], dur: 0.7, border: "border-primary-300/10", bg: "bg-primary-400/3" },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-[69] overflow-hidden">
      {ghosts.map((g, i) => (
        <motion.div
          key={i}
          className={cn("absolute rounded-[24px] border", g.border, g.bg)}
          style={{
            width: panelW,
            height: 280,
            left: "50%",
            top: "12vh",
            marginLeft: -panelW / 2,
          }}
          initial={{
            x: fdx,
            y: fdy,
            scale: g.scale[0],
            opacity: 0,
            borderRadius: "50%",
            rotate: g.rotate[0],
          }}
          animate={{
            x: 0,
            y: 0,
            scale: g.scale,
            opacity: g.opacity,
            borderRadius: ["50%", "36%", "24px", "24px"],
            rotate: g.rotate,
          }}
          transition={{
            duration: g.dur,
            delay: g.delay,
            ease: [0.23, 1, 0.32, 1],
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Orbiting particles                                                 */
/* ------------------------------------------------------------------ */

function OrbitingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-primary-400/30"
          initial={{ x: "50%", y: "50%", scale: 0 }}
          animate={{
            x: `${50 + 30 * Math.cos((i * 2 * Math.PI) / 5)}%`,
            y: `${50 + 30 * Math.sin((i * 2 * Math.PI) / 5)}%`,
            scale: [0, 1, 0.5, 1, 0],
            opacity: [0, 0.6, 0.3, 0.6, 0],
          }}
          transition={{
            duration: 4.5 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Detect OS                                                          */
/* ------------------------------------------------------------------ */

function useIsMac() {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(
      typeof navigator !== "undefined" &&
        /Mac|iPod|iPhone|iPad/.test(navigator.platform)
    );
  }, []);
  return isMac;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TAP_MOVE_THRESHOLD = 8;
const TAP_TIME_THRESHOLD = 300;
const DRAG_DELAY_MS = 300;

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function AiSearch({
  onSearch,
  open: controlledOpen,
  onOpenChange,
  placeholders = [
    "Search anything with AI…",
    "Try: apartments near downtown",
    "Find 3-bedroom villas under $500k",
    "Ask: best areas for families",
  ],
  suggestions = [],
  isSearching = false,
  query: controlledQuery,
  onQueryChange,
  buttonPosition = "bottom-right",
  buttonLabel = "AI Search",
  buttonClassName,
  panelClassName,
  id,
  minQueryLength = 2,
  showMic = false,
  onMicPress,
  disabled = false,
  aiRemainingCredit,
  children,
}: AiSearchProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalQuery, setInternalQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [fabOrigin, setFabOrigin] = useState({ x: 0, y: 0 });
  const [showTrail, setShowTrail] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Drag / tap tracking
  const [wasDragged, setWasDragged] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Touch-specific tracking
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchStartTime = useRef(0);
  const isTouchDragging = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fabRef = useRef<HTMLButtonElement>(null);
  const draggableNodeRef = useRef<HTMLDivElement>(null!);
  const inputRef = useRef<HTMLInputElement>(null);

  const isMac = useIsMac();

  const isOpen = controlledOpen ?? internalOpen;
  const query = controlledQuery ?? internalQuery;

  const setOpen = useCallback(
    (val: boolean) => {
      setInternalOpen(val);
      onOpenChange?.(val);
    },
    [onOpenChange]
  );

  const setQuery = useCallback(
    (val: string) => {
      setInternalQuery(val);
      onQueryChange?.(val);
    },
    [onQueryChange]
  );

  const canSearch = query.trim().length >= minQueryLength && !isSearching;

  /* ── Open / close ─────────────────────────────────────────────── */
  const handleOpen = useCallback(() => {
    if (disabled) return;

    if (fabRef.current) {
      const rect = fabRef.current.getBoundingClientRect();
      setFabOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }

    setShowTrail(true);
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 500);
    setTimeout(() => setShowTrail(false), 800);
  }, [disabled, setOpen]);

  const handleClose = useCallback(() => {
    setShowTrail(true);
    setOpen(false);
    setQuery("");
    setTimeout(() => setShowTrail(false), 600);
  }, [setOpen, setQuery]);

  /* ── Search ───────────────────────────────────────────────────── */
  const handleSubmit = useCallback(() => {
    if (!canSearch) return;
    onSearch(query.trim());
  }, [canSearch, onSearch, query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && canSearch) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape") handleClose();
    },
    [canSearch, handleSubmit, handleClose]
  );

  const handleSuggestionClick = useCallback(
    (s: AiSearchSuggestion) => {
      setQuery(s.label);
      onSearch(s.label);
    },
    [setQuery, onSearch]
  );

  /* ── ⌘K / Ctrl+K ──────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) handleClose();
        else handleOpen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, handleClose, handleOpen]);

  /* ── Desktop drag handlers (mouse) ───────────────────────────── */
  const handleDragStart = useCallback(
    (_e: DraggableEvent, data: DraggableData) => {
      dragStartPos.current = { x: data.x, y: data.y };
      setWasDragged(false);
    },
    []
  );

  const handleDragStop = useCallback(
    (_e: DraggableEvent, data: DraggableData) => {
      const movedX = Math.abs(data.x - dragStartPos.current.x);
      const movedY = Math.abs(data.y - dragStartPos.current.y);

      if (movedX + movedY > 5) {
        setWasDragged(true);
        setTimeout(() => setWasDragged(false), 200);
      }
    },
    []
  );

  const handleFabClick = useCallback(() => {
    if (wasDragged) return;
    handleOpen();
  }, [wasDragged, handleOpen]);

  /* ── Mobile touch handlers ────────────────────────────────────── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    touchStartTime.current = Date.now();
    isTouchDragging.current = false;

    if (holdTimer.current) clearTimeout(holdTimer.current);

    holdTimer.current = setTimeout(() => {
      isTouchDragging.current = true;
    }, DRAG_DELAY_MS);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);

    if (dx > TAP_MOVE_THRESHOLD || dy > TAP_MOVE_THRESHOLD) {
      isTouchDragging.current = true;
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }

      const elapsed = Date.now() - touchStartTime.current;

      if (!isTouchDragging.current && elapsed < TAP_TIME_THRESHOLD) {
        e.preventDefault();
        handleOpen();
      }

      isTouchDragging.current = false;
    },
    [handleOpen]
  );

  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, []);

  /* ── Layout ────────────────────────────────────────────────────── */
  const panelCenterX =
    typeof window !== "undefined" ? window.innerWidth / 2 : 300;
  const panelCenterY =
    typeof window !== "undefined" ? window.innerHeight * 0.15 + 140 : 240;
  const dx = fabOrigin.x - panelCenterX;
  const dy = fabOrigin.y - panelCenterY;

  const positionClass = {
    "bottom-right": "bottom-20 right-8",
    "bottom-left": "bottom-6 left-6",
    "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
  }[buttonPosition];

  return (
    <>
      {/* Trail effects */}
      <TrailSparks
        originX={fabOrigin.x}
        originY={fabOrigin.y}
        active={showTrail && isOpen}
      />
      <GhostTrail
        originX={fabOrigin.x}
        originY={fabOrigin.y}
        active={showTrail && isOpen}
      />

      {/* ========== DRAGGABLE FAB — always mounted, hidden when open ========== */}
      <Draggable
        nodeRef={draggableNodeRef as React.RefObject<HTMLElement>}
        onStart={handleDragStart}
        onStop={handleDragStop}
        handle=".drag-handle"
        disabled={isOpen}
      >
        <div
          ref={draggableNodeRef}
          className={cn("fixed z-[60]", positionClass)}
          style={{
            touchAction: "none",
            // Hide when modal is open but keep mounted to preserve position
            pointerEvents: isOpen ? "none" : "auto",
            visibility: isOpen ? "hidden" : "visible",
          }}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: isOpen ? 0 : 1,
              opacity: isOpen ? 0 : 1,
            }}
            transition={
              isOpen
                ? { duration: 0.15, ease: "easeIn" }
                : { type: "spring", stiffness: 300, damping: 20 }
            }
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
          >
            <motion.button
              id={id}
              ref={fabRef}
              type="button"
              disabled={disabled}
              onClick={handleFabClick}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              whileTap={{ scale: 0.92 }}
              className={cn(
                "drag-handle relative flex items-center overflow-hidden",
                "rounded-full shadow-xl shadow-tertiary-900/20",
                "bg-linear-to-br from-primary-500 via-primary-600 to-tertiary-500",
                "text-white outline-none",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "cursor-grab active:cursor-grabbing",
                "select-none",
                buttonClassName
              )}
              aria-label="Open AI Search"
            >
              {/* Pulse ring */}
              <motion.span
                className="absolute inset-0 rounded-full bg-primary-400/20"
                variants={pulseRingVariants}
                initial="initial"
                animate="animate"
              />

              {/* Hover glow */}
              <motion.div
                className="absolute inset-0 rounded-full bg-white/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              />

              <motion.div
                className="relative flex items-center gap-2 whitespace-nowrap"
                animate={{
                  paddingLeft: isHovered ? 20 : 16,
                  paddingRight: isHovered ? 20 : 16,
                  paddingTop: 16,
                  paddingBottom: 16,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {/* AI Icon */}
                <motion.div
                  animate={{ rotate: isHovered ? 360 : 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <BotMessageSquare className="h-6 w-6 shrink-0" />
                </motion.div>

                {/* Expanded label + shortcut on hover */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      className="flex items-center gap-2.5 overflow-hidden"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{
                        width: "auto",
                        opacity: 1,
                        transition: {
                          width: {
                            type: "spring",
                            stiffness: 400,
                            damping: 28,
                          },
                          opacity: { duration: 0.15, delay: 0.08 },
                        },
                      }}
                      exit={{
                        width: 0,
                        opacity: 0,
                        transition: {
                          width: { duration: 0.2, ease: "easeIn" },
                          opacity: { duration: 0.1 },
                        },
                      }}
                    >
                      <span className="text-sm font-semibold">
                        {buttonLabel}
                      </span>

                      <kbd
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5",
                          "bg-white/20 text-[11px] font-medium leading-none",
                          "border border-white/25"
                        )}
                      >
                        {isMac ? (
                          <>
                            <Command className="h-2.5 w-2.5" />
                            <span>K</span>
                          </>
                        ) : (
                          <span>Ctrl+K</span>
                        )}
                      </kbd>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.button>
          </motion.div>
        </div>
      </Draggable>

      {/* ========== OVERLAY ========== */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] sm:pt-[16vh] px-4">
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-secondary-900/50 backdrop-blur-sm dark:bg-black/65"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.35 } }}
              exit={{
                opacity: 0,
                transition: { duration: 0.25, delay: 0.05 },
              }}
              onClick={handleClose}
            />

            {/* ---- PANEL ---- */}
            <motion.div
              className={cn(
                "relative z-[71] w-full max-w-xl overflow-hidden",
                "border border-border",
                "bg-bg-card/30 dark:bg-linear-to-br dark:from-primary-800/50 dark:via-primary-500/10 dark:to-tertiary-500/30",
                "shadow-2xl shadow-black/15 dark:shadow-black/40",
                panelClassName
              )}
              style={{ borderRadius: 24 }}
              initial={{
                x: dx,
                y: dy,
                scale: 0.05,
                opacity: 0,
                rotate: -12,
                borderRadius: "50%",
              }}
              animate={{
                x: 0,
                y: 0,
                scale: 1,
                opacity: 1,
                rotate: -360,
                borderRadius: "24px",
                transition: {
                  x: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
                  y: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
                  scale: { duration: 0.55, ease: [0.34, 1.56, 0.64, 1] },
                  opacity: { duration: 0.25, ease: "easeOut" },
                  rotate: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                  borderRadius: {
                    duration: 0.4,
                    delay: 0.15,
                    ease: "easeOut",
                  },
                  staggerChildren: 0.06,
                  delayChildren: 0.3,
                },
              }}
              exit={{
                x: dx,
                y: dy,
                scale: 0.05,
                opacity: 0,
                rotate: 180,
                borderRadius: "50%",
                transition: {
                  duration: 0.4,
                  ease: [0.55, 0, 1, 0.45],
                  opacity: { duration: 0.25, delay: 0.1 },
                  staggerChildren: 0.02,
                  staggerDirection: -1,
                },
              }}
            >
              {/* Entrance glow */}
              <motion.div
                className="pointer-events-none absolute inset-0 z-10 rounded-[24px] bg-gradient-to-br from-primary-400/20 via-tertiary-400/10 to-transparent"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
              />

              <OrbitingParticles />

              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary-500/5 via-transparent to-transparent dark:from-primary-400/8" />

              {/* Header */}
              <motion.div
                variants={itemVariants}
                className="relative px-5 pt-5 pb-1"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <motion.div
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-tertiary-500 shadow-md shadow-primary-500/20"
                      initial={{ rotate: -540, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 180,
                        damping: 14,
                        delay: 0.35,
                      }}
                    >
                      <BotMessageSquare className="h-[18px] w-[18px] text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-base font-extrabold text-text-primary leading-tight">
                        {buttonLabel}
                      </h2>
                      <p className="text-[11px] font-medium text-text-tertiary">
                        Powered by Kimsha
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <kbd
                      className={cn(
                        "hidden sm:inline-flex items-center gap-0.5 rounded-lg px-2 py-1",
                        "border border-border bg-bg-input text-[11px] font-medium text-text-tertiary"
                      )}
                    >
                      {isMac ? (
                        <>
                          <Command className="h-2.5 w-2.5" />
                          <span>K</span>
                        </>
                      ) : (
                        <span>Ctrl+K</span>
                      )}
                    </kbd>

                    <motion.button
                      type="button"
                      onClick={handleClose}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl",
                        "border border-border bg-bg-input text-text-secondary",
                        "transition-colors hover:bg-secondary-100 hover:text-text-primary",
                        "dark:hover:bg-secondary-700"
                      )}
                      aria-label="Close search"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              {/* Input */}
              <motion.div
                variants={itemVariants}
                className="relative px-5 pt-3 pb-1"
              >
                <div
                  className={cn(
                    "group relative flex items-center gap-2 rounded-2xl border-2 transition-all duration-300",
                    "bg-bg-input",
                    isFocused
                      ? "border-primary-400 shadow-lg shadow-primary-500/10 dark:shadow-primary-400/10"
                      : "border-border hover:border-secondary-300 dark:hover:border-secondary-600"
                  )}
                >
                  <AnimatePresence>
                    {isFocused && (
                      <motion.div
                        className="absolute -bottom-px left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-primary-400 via-tertiary-400 to-primary-400"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        exit={{ scaleX: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        style={{ transformOrigin: "center" }}
                      />
                    )}
                  </AnimatePresence>

                  <div className="flex shrink-0 items-center pl-4">
                    <motion.div
                      animate={
                        isSearching
                          ? { rotate: 360 }
                          : isFocused
                            ? { scale: [1, 1.12, 1] }
                            : {}
                      }
                      transition={
                        isSearching
                          ? {
                              duration: 0.8,
                              repeat: Infinity,
                              ease: "linear",
                            }
                          : { duration: 0.25 }
                      }
                    >
                      {isSearching ? (
                        <Loader2 className="h-5 w-5 text-primary-500 dark:text-primary-400" />
                      ) : (
                        <Search
                          className={cn(
                            "h-5 w-5 transition-colors duration-200",
                            isFocused
                              ? "text-primary-500 dark:text-primary-400"
                              : "text-text-tertiary"
                          )}
                        />
                      )}
                    </motion.div>
                  </div>

                  <div className="relative min-w-0 flex-1 py-3.5">
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-transparent text-[15px] font-medium text-text-primary outline-none placeholder:text-transparent"
                      aria-label="Search query"
                    />
                    {!query && (
                      <AnimatedPlaceholder placeholders={placeholders} />
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1 pr-2">
                    {showMic && onMicPress && (
                      <motion.button
                        type="button"
                        onClick={onMicPress}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-xl",
                          "text-text-tertiary transition-colors",
                          "hover:bg-secondary-100 hover:text-text-primary",
                          "dark:hover:bg-secondary-700"
                        )}
                        aria-label="Voice search"
                      >
                        <Mic className="h-4 w-4" />
                      </motion.button>
                    )}

                    <AnimatePresence>
                      {query.length > 0 && (
                        <motion.button
                          type="button"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 20,
                          }}
                          onClick={() => {
                            setQuery("");
                            inputRef.current?.focus();
                          }}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-xl",
                            "text-text-tertiary transition-colors",
                            "hover:bg-secondary-100 hover:text-text-primary",
                            "dark:hover:bg-secondary-700"
                          )}
                          aria-label="Clear"
                        >
                          <X className="h-3.5 w-3.5" />
                        </motion.button>
                      )}
                    </AnimatePresence>

                    <motion.button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!canSearch || (aiRemainingCredit !== undefined && aiRemainingCredit <= 0)}
                      whileHover={canSearch && !(aiRemainingCredit !== undefined && aiRemainingCredit <= 0) ? { scale: 1.05 } : {}}
                      whileTap={canSearch && !(aiRemainingCredit !== undefined && aiRemainingCredit <= 0) ? { scale: 0.92 } : {}}
                      className={cn(
                        "flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition-all duration-200",
                        canSearch && !(aiRemainingCredit !== undefined && aiRemainingCredit <= 0)
                          ? "bg-linear-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/30"
                          : "bg-secondary-100 text-text-tertiary dark:bg-secondary-700 dark:text-secondary-400 cursor-not-allowed"
                      )}
                      aria-label="Search"
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">Search</span>
                    </motion.button>
                  </div>
                </div>

                <div className="mt-1.5 flex items-center justify-between px-1">
                  <AnimatePresence mode="wait">
                    {aiRemainingCredit !== undefined && aiRemainingCredit <= 0 ? (
                      <motion.span
                        key="exhausted"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-[11px] font-bold text-red-500 dark:text-red-400"
                      >
                        {t("profile.ai_credit.exhausted_notice", "Credit exhausted! Please try again tomorrow.")}
                      </motion.span>
                    ) : query.length > 0 && query.length < minQueryLength ? (
                      <motion.span
                        key="chars-left"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        className="text-[11px] font-medium text-text-tertiary"
                      >
                        Type {minQueryLength - query.length} more
                        {minQueryLength - query.length !== 1
                          ? " chars"
                          : " char"}
                        …
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                  <span className="ml-auto text-[11px] font-medium text-text-tertiary/50">
                    <kbd className="rounded bg-secondary-100 px-1 py-0.5 text-[10px] font-mono dark:bg-secondary-700">
                      Esc
                    </kbd>{" "}
                    to close
                  </span>
                </div>
              </motion.div>

              {/* Suggestions */}
              {suggestions.length > 0 && !query && (aiRemainingCredit === undefined || aiRemainingCredit > 0) && (
                <motion.div
                  variants={itemVariants}
                  className="relative px-5 pt-3 pb-1"
                >
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary/60">
                    Suggestions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                      <motion.button
                        key={s.id}
                        type="button"
                        onClick={() => handleSuggestionClick(s)}
                        initial={{ opacity: 0, scale: 0.85, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                          delay: 0.4 + i * 0.05,
                          type: "spring",
                          stiffness: 300,
                          damping: 22,
                        }}
                        whileHover={{ scale: 1.04, y: -1 }}
                        whileTap={{ scale: 0.96 }}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2",
                          "text-xs font-medium text-text-secondary bg-bg-input transition-colors",
                          "hover:border-primary-400/40 hover:bg-primary-500/5 hover:text-primary-500",
                          "dark:hover:bg-primary-400/8 dark:hover:text-primary-400"
                        )}
                      >
                        <SuggestionIcon type={s.icon} />
                        {s.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Children */}
              {children && (
                <motion.div
                  variants={itemVariants}
                  className="relative max-h-[40vh] overflow-y-auto px-5 pt-2 pb-5 scrollbar-hide"
                >
                  {children}
                </motion.div>
              )}

              {/* Footer */}
              <motion.div
                variants={itemVariants}
                className={cn(
                  "relative flex items-center justify-center gap-1.5 border-t border-border px-5 py-3",
                  "bg-secondary-50/50 dark:bg-secondary-900/30"
                )}
              >
                <Sparkles className="h-3 w-3 text-primary-500/50 dark:text-primary-400/50" />
                <span className="text-[11px] font-medium text-text-tertiary/60">
                  AI-powered results may vary
                </span>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

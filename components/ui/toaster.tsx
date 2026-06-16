"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast, ToastItem } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismissToast } = useToast();

  return (
    <div 
      className="fixed z-[100] bottom-4 right-4 flex flex-col gap-3 pointer-events-none max-w-[420px] w-full sm:w-[420px] max-sm:top-4 max-sm:bottom-auto max-sm:left-4 max-sm:right-4 max-sm:max-w-none" 
      role="region" 
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const variantStyles = {
    default: {
      bg: "bg-white dark:bg-secondary-900",
      border: "border-primary-500/20",
      icon: <Info className="w-5 h-5 text-primary-500" />,
      accent: "bg-primary-500",
    },
    success: {
      bg: "bg-white dark:bg-secondary-900",
      border: "border-tertiary-500/20",
      icon: <CheckCircle2 className="w-5 h-5 text-tertiary-500" />,
      accent: "bg-tertiary-500",
    },
    error: {
      bg: "bg-white dark:bg-secondary-900",
      border: "border-red-500/20",
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      accent: "bg-red-500",
    },
  };

  const style = variantStyles[toast.variant] || variantStyles.default;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: isMobile ? -40 : 40, scale: 0.8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)", transition: { duration: 0.2 } }}
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 30, 
        mass: 1 
      }}
      drag={isMobile ? "y" : "x"}
      dragConstraints={isMobile ? { top: -300, bottom: 0 } : { left: 0, right: 300 }}
      dragElastic={0.5}
      whileDrag={{ scale: 1.02, rotate: isMobile ? 0 : 2 }}
      onDragEnd={(_, info) => {
        const threshold = 100;
        if (isMobile) {
          if (info.offset.y < -threshold || info.velocity.y < -500) onDismiss();
        } else {
          if (info.offset.x > threshold || info.velocity.x > 500) onDismiss();
        }
      }}
      className={cn(
        "pointer-events-auto relative group flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-xl overflow-hidden transition-shadow hover:shadow-2xl",
        style.bg,
        style.border
      )}
    >
      {/* Accent Line */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", style.accent)} />

      <div className="flex-shrink-0 mt-0.5">
        {style.icon}
      </div>

      <div className="flex-1 min-w-0">
        {toast.title && (
          <h3 className="text-sm font-bold text-text-primary leading-tight mb-0.5">
            {toast.title}
          </h3>
        )}
        <p className="text-[13px] text-text-secondary leading-normal">
          {toast.message}
        </p>
      </div>

      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-tertiary hover:text-text-primary"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar (Optional, for visual feedback of duration) */}
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: toast.durationMs / 1000, ease: "linear" }}
        className={cn("absolute bottom-0 left-0 h-0.5 opacity-30", style.accent)}
      />
    </motion.div>
  );
}

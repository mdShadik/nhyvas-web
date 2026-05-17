"use client";

import { useMemo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LoginCard } from "@/components/auth/LoginCard";

type Props = {
  open: boolean;
  onClose: () => void;
  nextUrl?: string | null;
  title?: string;
  description?: string;
};

export function LoginModal({ open, onClose, nextUrl, title, description }: Props) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const safeNext = useMemo(() => {
    const raw = (nextUrl ?? "").trim();
    if (!raw) return "";
    return raw.startsWith("/") ? raw : "";
  }, [nextUrl]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md pointer-events-auto"
          >
            <LoginCard
              nextUrl={safeNext}
              onClose={onClose}
              title={title}
              description={description}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

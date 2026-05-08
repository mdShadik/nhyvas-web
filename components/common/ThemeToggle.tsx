"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import { MoonStar, SunIcon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-[72px] sm:h-11 sm:w-[88px] rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 opacity-0" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="group relative flex h-9 w-[72px] sm:h-11 sm:w-[88px] items-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[0_0_20px_rgba(46,86,233,0.15)] transition-all duration-300 hover:border-[var(--accent)]/50 hover:shadow-[0_0_28px_rgba(46,86,233,0.25)]"
      type="button"
    >
      <motion.div
        layout
        animate={{
          x: theme === "light" ? 0 : window.innerWidth < 640 ? 32 : 40,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 35,
          mass: 0.8,
        }}
        className="absolute h-7 w-8 sm:h-9 sm:w-10 rounded-full bg-gradient-to-br from-[#1A9CFF] via-[#2E56E9] to-[#5B21B6] shadow-lg"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />

        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white/30"
          initial={{ scale: 1, opacity: 0.5 }}
          whileHover={{ scale: 1.1, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      <div className="relative z-10 flex w-full items-center justify-between px-2 sm:px-2.5">
        <motion.div
          animate={{
            scale: theme === "light" ? 1 : 0.85,
            rotate: theme === "light" ? 0 : -30,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <SunIcon
            className={`h-4 w-4 sm:h-[18px] sm:w-[18px] transition-colors duration-300 ${
              theme === "light"
                ? "text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]"
                : "text-[var(--color-text-secondary)] group-hover:text-yellow-200"
            }`}
          />
        </motion.div>

        <motion.div
          animate={{
            scale: theme === "dark" ? 1 : 0.85,
            rotate: theme === "dark" ? 0 : 30,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <MoonStar
            className={`h-4 w-4 sm:h-[18px] sm:w-[18px] transition-colors duration-300 ${
              theme === "dark"
                ? "text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]"
                : "text-[var(--color-text-secondary)] group-hover:text-slate-600"
            }`}
          />
        </motion.div>
      </div>

      <AnimatePresence>
        {theme === "dark" && (
          <>
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="absolute right-2 top-1 h-1 w-1 rounded-full bg-[var(--accent)] sm:right-3"
            />
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.6, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="absolute right-5 top-2 h-0.5 w-0.5 rounded-full bg-[var(--accent)] sm:right-6 sm:top-2.5"
            />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {theme === "light" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
            animate={{ opacity: 0.3, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
            transition={{ duration: 0.4 }}
            className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2"
          >
            {[...Array(4)].map((_, i) => (
              <span
                key={i}
                className="absolute h-0.5 w-1 rounded-full bg-[#1A9CFF] sm:w-1.5"
                style={{
                  transform: `rotate(${i * 45}deg) translateX(${
                    window.innerWidth < 640 ? 14 : 18
                  }px)`,
                  transformOrigin: "center",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
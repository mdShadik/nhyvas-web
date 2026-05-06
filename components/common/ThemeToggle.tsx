"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

function SunIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" stroke="currentColor" />
      <path d="M12 2V5" stroke="currentColor" strokeLinecap="round" />
      <path d="M12 19V22" stroke="currentColor" strokeLinecap="round" />
      <path d="M2 12H5" stroke="currentColor" strokeLinecap="round" />
      <path d="M19 12H22" stroke="currentColor" strokeLinecap="round" />
      <path d="M4.93 4.93L7.05 7.05" stroke="currentColor" strokeLinecap="round" />
      <path d="M16.95 16.95L19.07 19.07" stroke="currentColor" strokeLinecap="round" />
      <path d="M16.95 7.05L19.07 4.93" stroke="currentColor" strokeLinecap="round" />
      <path d="M4.93 19.07L7.05 16.95" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M20 14.5C19.13 14.83 18.19 15 17.25 15C12.97 15 9.5 11.53 9.5 7.25C9.5 6.31 9.67 5.37 10 4.5C6.51 5.83 4 9.2 4 13.13C4 18.23 8.14 22.37 13.24 22.37C17.17 22.37 20.54 19.86 21.87 16.37C21.25 16.66 20.63 14.74 20 14.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="group relative flex h-11 w-[88px] items-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[0_0_20px_rgba(46,86,233,0.15)] transition-all duration-300 hover:border-[var(--accent)]/50 hover:shadow-[0_0_28px_rgba(46,86,233,0.25)]"
      type="button"
    >
      <motion.div
        layout
        animate={{
          x: theme === "light" ? 0 : 40,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 35,
          mass: 0.8,
        }}
        className="absolute h-9 w-10 rounded-full bg-gradient-to-br from-[#1A9CFF] via-[#2E56E9] to-[#5B21B6] shadow-lg"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />

        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white/30"
          initial={{ scale: 1, opacity: 0.5 }}
          whileHover={{ scale: 1.1, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      <div className="relative z-10 flex w-full items-center justify-between px-2.5">
        <motion.div
          animate={{
            scale: theme === "light" ? 1 : 0.85,
            rotate: theme === "light" ? 0 : -30,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <SunIcon
            className={`h-[18px] w-[18px] transition-colors duration-300 ${
              theme === "light"
                ? "text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]"
                : "text-[var(--muted)] group-hover:text-[var(--accent)]"
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
          <MoonIcon
            className={`h-[18px] w-[18px] transition-colors duration-300 ${
              theme === "dark"
                ? "text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]"
                : "text-[var(--muted)] group-hover:text-[var(--accent)]"
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
              className="absolute right-3 top-1 h-1 w-1 rounded-full bg-[var(--accent)]"
            />
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.6, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="absolute right-6 top-2.5 h-0.5 w-0.5 rounded-full bg-[var(--accent)]"
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
                className="absolute h-0.5 w-1.5 rounded-full bg-[#1A9CFF]"
                style={{
                  transform: `rotate(${i * 45}deg) translateX(18px)`,
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

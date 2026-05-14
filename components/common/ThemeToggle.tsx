"use client";

import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-16 rounded-full bg-bg-card border border-border" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="
        relative flex h-9 w-16 items-center
        rounded-full border border-border
        bg-bg-card p-1
        transition-colors duration-300
      "
    >
      {/* Active pill */}
      <motion.div
        animate={{
          x: isDark ? 28 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 35,
        }}
        className="
          absolute left-1 top-1
          flex h-7 w-7 items-center justify-center
          rounded-full
          bg-linear-to-br
          from-primary-500
          to-tertiary-500/50
          shadow-md
        "
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-white" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-white" />
        )}
      </motion.div>

      {/* Icons */}
      <div className="flex w-full items-center justify-between px-1.5">
        <Sun
          className={`
            h-3.5 w-3.5 transition-colors duration-300
            ${!isDark ? "text-transparent" : "text-text-tertiary"}
          `}
        />

        <Moon
          className={`
            h-3.5 w-3.5 transition-colors duration-300
            ${isDark ? "text-transparent" : "text-text-tertiary"}
          `}
        />
      </div>
    </button>
  );
}
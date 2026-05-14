"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Language = "en" | "np";

import { getInitialLanguage, setAppLanguage } from "@/i18n";

export function LanguageToggle() {
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] =
    useState<Language>(getInitialLanguage());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    setAppLanguage(language);
    document.documentElement.lang =
      language === "np" ? "ne" : "en";
  }, [language, mounted]);

  if (!mounted) {
    return (
      <div className="h-9 w-16 rounded-full border border-border bg-bg-card" />
    );
  }

  const isEnglish = language === "en";

  return (
    <button
      type="button"
      onClick={() =>
        setLanguage((prev) => (prev === "en" ? "np" : "en"))
      }
      aria-label="Toggle language"
      className="
        relative flex h-9 w-16 items-center
        rounded-full border border-border
        bg-bg-card p-1
        transition-colors duration-300
      "
    >
      {/* Sliding pill */}
      <motion.div
        animate={{
          x: isEnglish ? 0 : 28,
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
          to-tertiary-500/60
          shadow-md
        "
      >
        <span className="text-md">
          {isEnglish ? "🇬🇧" : "🇳🇵"}
        </span>
      </motion.div>

      {/* Static flags */}
      <div className="flex w-full items-center justify-between px-1.25">
        <span
          className={`
            text-sm transition-opacity duration-300
            ${isEnglish ? "opacity-0" : "opacity-70"}
          `}
        >
          🇬🇧
        </span>

        <span
          className={`
            text-sm transition-opacity duration-300
            ${!isEnglish ? "opacity-0" : "opacity-70"}
          `}
        >
          🇳🇵
        </span>
      </div>
    </button>
  );
}
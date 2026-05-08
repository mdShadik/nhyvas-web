"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type Language = "en" | "np";
import { getInitialLanguage, setAppLanguage } from "@/i18n";

// const LANGUAGE_STORAGE_KEY = "nhyvas-language";

function FlagLabel({
  flag,
  code,
  active,
}: {
  flag: string;
  code: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-0.5 transition-colors duration-300 ${
        active
          ? "text-white"
          : "text-[var(--muted)] group-hover:text-[var(--accent)]"
      }`}
    >
      <span className="text-[20px] sm:text-[15px] leading-none">{flag}</span>

      <span className={`text-[8px] hidden sm:block font-semibold tracking-[0.18em] sm:tracking-[0.22em] ${active ? "text-white" : "text-[var(--color-text-tertiary)] group-hover:text-[var(--accent)]"}`}>
        {code}
      </span>
    </div>
  );
}

export function LanguageToggle() {
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<Language>(getInitialLanguage());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    setAppLanguage(language);
    document.documentElement.lang = language === "np" ? "ne" : "en";
  }, [language, mounted]);

  if (!mounted) {
    return (
      <div className="h-9 w-[88px] sm:h-11 sm:w-[110px] rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 opacity-0" />
    );
  }

  const isEnglish = language === "en";

  return (
    <button
      type="button"
      onClick={() => setLanguage((prev) => (prev === "en" ? "np" : "en"))}
      role="switch"
      aria-checked={!isEnglish}
      aria-label={`Switch to ${
        isEnglish ? "Nepali" : "English"
      } language`}
      className="group relative flex h-9 w-[88px] sm:h-11 sm:w-[110px] items-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[0_0_20px_rgba(46,86,233,0.15)] transition-all duration-300 hover:border-[var(--accent)]/50 hover:shadow-[0_0_28px_rgba(46,86,233,0.25)]"
    >
      <motion.div
        animate={{
          x: isEnglish ? 0 : window.innerWidth < 640 ? 40 : 50,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 35,
          mass: 0.8,
        }}
        className="absolute left-1 top-1 h-7 w-[40px] sm:h-9 sm:w-[52px] rounded-full bg-gradient-to-br from-[#1A9CFF] via-[#2E56E9] to-[#5B21B6] shadow-lg"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />

        <div className="absolute inset-0 rounded-full border-2 border-white/30" />
      </motion.div>

      <div className="relative z-10 flex w-full items-center justify-between px-1.5 sm:px-2">
        <motion.div
          animate={{
            scale: isEnglish ? 1 : 0.88,
            rotate: isEnglish ? 0 : -8,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="w-[36px] sm:w-[46px]"
        >
          <FlagLabel flag="🇬🇧" code="EN" active={isEnglish} />
        </motion.div>

        <motion.div
          animate={{
            scale: !isEnglish ? 1 : 0.88,
            rotate: !isEnglish ? 0 : 8,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="w-[36px] sm:w-[46px]"
        >
          <FlagLabel flag="🇳🇵" code="NP" active={!isEnglish} />
        </motion.div>
      </div>

      <AnimatePresence>
        {isEnglish ? (
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
        ) : (
          <>
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="absolute left-2 top-1 h-1 w-1 rounded-full bg-[var(--accent)] sm:left-3"
            />

            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.6, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="absolute left-5 top-2 h-0.5 w-0.5 rounded-full bg-[var(--accent)] sm:left-6 sm:top-2.5"
            />
          </>
        )}
      </AnimatePresence>
    </button>
  );
}
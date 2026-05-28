"use client";

import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";
import { darkLogo, lightLogo } from "@/assets";
import { motion } from "framer-motion";

export function PageLoading() {
  const { theme } = useTheme();
  const logoUrl = theme === "dark" ? darkLogo : lightLogo;

  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-bg-page transition-colors duration-300">
      <div className="relative flex flex-col items-center gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative h-12 w-48 sm:h-14 sm:w-56"
        >
          <Image
            src={logoUrl}
            alt="Nhyvas"
            fill
            priority
            className="object-contain"
          />
        </motion.div>

        <div className="relative h-1 w-48 overflow-hidden rounded-full bg-secondary-200 dark:bg-secondary-800 sm:w-56">
          <motion.div
            className="absolute h-full bg-linear-to-r from-primary-500 via-primary-600 to-tertiary-500"
            initial={{ left: "-100%", width: "100%" }}
            animate={{ left: "100%" }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    </div>
  );
}

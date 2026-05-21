"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion, type Variants } from "motion/react";
import { type StoryGroup } from "@/services/apiService/stories";

type Props = {
  group: StoryGroup;
  onClick: () => void;
  isSeen?: boolean;
  isOwner?: boolean;
  index?: number;
};

/* ------------------------------------------------------------------ */
/*  Variants                                                           */
/* ------------------------------------------------------------------ */

const circleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.5,
    y: 20,
  },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  }),
};

const ringVariants: Variants = {
  hidden: { rotate: 0 },
  visible: (i: number) => ({
    rotate: 360,
    transition: {
      delay: i * 0.06 + 0.15,
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const avatarVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      delay: i * 0.06 + 0.12,
      type: "spring",
      stiffness: 300,
      damping: 18,
    },
  }),
};

const labelVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06 + 0.25,
      duration: 0.3,
      ease: "easeOut",
    },
  }),
};

const plusVariants: Variants = {
  hidden: { scale: 0, rotate: -180 },
  visible: (i: number) => ({
    scale: 1,
    rotate: 0,
    transition: {
      delay: i * 0.06 + 0.35,
      type: "spring",
      stiffness: 400,
      damping: 15,
    },
  }),
};

/* ------------------------------------------------------------------ */
/*  Shimmer ring for unseen stories                                    */
/* ------------------------------------------------------------------ */

function GradientRing({ isSeen }: { isSeen: boolean }) {
  if (isSeen) return null;

  return (
    <motion.div
      className="absolute inset-0 rounded-full"
      style={{
        background:
          "conic-gradient(from 0deg, var(--color-primary-500), var(--color-tertiary-400), var(--color-primary-400), var(--color-tertiary-500), var(--color-primary-500))",
        mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 3px))",
        WebkitMask:
          "radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 3px))",
      }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function StoryCircle({
  group,
  onClick,
  isSeen = false,
  isOwner = false,
  index = 0,
}: Props) {
  return (
    <motion.button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 focus:outline-none shrink-0"
      variants={circleVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Ring + Avatar */}
      <motion.div
        className={cn(
          "relative h-18 w-18 rounded-full p-0.5",
          isSeen
            ? "bg-secondary-200 dark:bg-secondary-700"
            : "bg-gradient-to-tr from-primary-500 via-tertiary-500 to-primary-400"
        )}
        variants={ringVariants}
        custom={index}
      >
        {/* Animated conic shimmer for unseen */}
        <GradientRing isSeen={isSeen} />

        {/* Avatar container */}
        <motion.div
          className="relative h-full w-full overflow-hidden rounded-full border-2 border-white dark:border-bg-page bg-secondary-100 dark:bg-secondary-800"
          variants={avatarVariants}
          custom={index}
        >
          <Image
            src={group.landlordAvatar || "/assets/images/default-avatar.png"}
            alt={group.landlordName}
            fill
            unoptimized
            className="object-cover"
            sizes="72px"
          />
        </motion.div>

        {/* Owner plus badge */}
        {isOwner && (
          <motion.div
            className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white dark:border-bg-page bg-primary-600 text-white shadow-sm"
            variants={plusVariants}
            custom={index}
          >
            <span className="text-lg font-bold leading-none">+</span>
          </motion.div>
        )}
      </motion.div>

      {/* Label */}
      <motion.span
        className="max-w-20 truncate text-[11px] font-medium text-text-primary"
        variants={labelVariants}
        custom={index}
      >
        {isOwner ? "Your Story" : group.landlordName}
      </motion.span>
    </motion.button>
  );
}
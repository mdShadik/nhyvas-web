import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

const selectTheme =
  "w-full appearance-none rounded-2xl border bg-bg-input bg-[length:1rem_1rem] bg-[right_0.75rem_center] bg-no-repeat px-4 py-3 text-sm text-text-primary outline-none transition " +
  "focus:border-primary-400 focus:ring-4 focus:ring-primary-500/15 " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  "[&>option]:bg-bg-card [&>option]:text-text-primary";

/** Chevron via embedded SVG so native `<select>` matches app theme in light/dark. */
const chevronBg =
  "bg-[image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(selectTheme, chevronBg, "bg-bg-page", className)} {...props} />;
}

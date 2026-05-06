import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import styles from "./badge.module.css";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "warning" | "danger" | "muted";
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <span className={cn(styles.uiBadge, styles[`uiBadge${variant.charAt(0).toUpperCase() + variant.slice(1)}`], className)} {...props} />;
}

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import styles from "./input.module.css";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(styles.uiInput, "bg-bg-page focus:border-primary-400 focus:ring-1 focus:ring-primary-500", className)} {...props} />;
}

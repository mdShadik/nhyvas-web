import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import styles from "./input.module.css";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(styles.uiInput, className)} {...props} />;
}

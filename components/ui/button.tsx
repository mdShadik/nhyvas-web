import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils"
import styles from "./button.module.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
};

export function Button({
  className,
  variant = "default",
  size = "md",
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        styles.uiButton,
        disabled && styles.uiButtonDisabled,
        styles[`uiButton${size.charAt(0).toUpperCase() + size.slice(1)}`],
        styles[`uiButton${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
        className
      )}
      disabled={disabled}
      {...props}
    />
  );
}

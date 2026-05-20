// CloseButton.tsx
import React from "react";
import styles from "./styles.module.css";

interface CloseButtonProps {
  onClick: () => void;
  position?: "top-left" | "top-right";
  icon?: React.ReactNode;
}

const DefaultCloseIcon: React.FC = () => (
  <svg
    className={styles.closeIcon}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CloseButton: React.FC<CloseButtonProps> = ({
  onClick,
  position = "top-right",
  icon,
}) => {
  return (
    <button
      className={`${styles.closeButton} ${
        position === "top-left" ? styles.closeButtonTopLeft : styles.closeButtonTopRight
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label="Close stories"
      type="button"
    >
      {icon || <DefaultCloseIcon />}
    </button>
  );
};

export default React.memo(CloseButton);
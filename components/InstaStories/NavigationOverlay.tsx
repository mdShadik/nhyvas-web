// NavigationOverlay.tsx
import React from "react";
import styles from "./styles.module.css";

interface NavigationOverlayProps {
  onPrev: () => void;
  onNext: () => void;
}

const NavigationOverlay: React.FC<NavigationOverlayProps> = ({ onPrev, onNext }) => {
  return (
    <div className={styles.navigationOverlay}>
      <div className={styles.navLeft} onClick={onPrev} role="button" aria-label="Previous story" />
      <div className={styles.navRight} onClick={onNext} role="button" aria-label="Next story" />
    </div>
  );
};

export default React.memo(NavigationOverlay);
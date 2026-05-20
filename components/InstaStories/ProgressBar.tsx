// ProgressBar.tsx
import React, { useMemo } from "react";
import styles from "./styles.module.css";

interface ProgressBarProps {
  count: number;
  currentIndex: number;
  progress: number;
  containerStyles?: React.CSSProperties;
  barStyles?: React.CSSProperties;
  fillStyles?: React.CSSProperties;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  count,
  currentIndex,
  progress,
  containerStyles,
  barStyles,
  fillStyles,
}) => {
  const segments = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      let scaleX: number;
      let className: string;

      if (i < currentIndex) {
        scaleX = 1;
        className = styles.progressFillCompleted;
      } else if (i === currentIndex) {
        scaleX = progress;
        className = styles.progressFillActive;
      } else {
        scaleX = 0;
        className = styles.progressFillPending;
      }

      return { index: i, scaleX, className };
    });
  }, [count, currentIndex, progress]);

  return (
    <div className={styles.progressContainer} style={containerStyles}>
      {segments.map((seg) => (
        <div key={seg.index} className={styles.progressBar} style={barStyles}>
          <div
            className={`${styles.progressFill} ${seg.className}`}
            style={{
              transform: `scaleX(${seg.scaleX})`,
              ...fillStyles,
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default React.memo(ProgressBar);
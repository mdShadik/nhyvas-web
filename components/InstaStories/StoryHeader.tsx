// StoryHeader.tsx
import React from "react";
import styles from "./styles.module.css";
import CloseButton from "./CloseButton";
import { StoryHeader as StoryHeaderType } from "./types";

interface StoryHeaderProps {
  header?: StoryHeaderType;
  customHeader?: React.FC<StoryHeaderType & { onClose: () => void }>;
  showCloseButton?: boolean;
  closeButtonPosition?: "top-left" | "top-right";
  closeIcon?: React.ReactNode;
  onClose: () => void;
}

const StoryHeader: React.FC<StoryHeaderProps> = ({
  header,
  customHeader: CustomHeader,
  showCloseButton = true,
  closeButtonPosition = "top-right",
  closeIcon,
  onClose,
}) => {
  if (CustomHeader && header) {
    return <CustomHeader {...header} onClose={onClose} />;
  }

  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        {header?.profileImage && (
          <img
            className={styles.profileImage}
            src={header.profileImage}
            alt={header.heading || "Profile"}
            loading="eager"
          />
        )}
        {header && (
          <div className={styles.headerText}>
            {header.heading && <span className={styles.heading}>{header.heading}</span>}
            {header.subheading && (
              <span className={styles.subheading}>{header.subheading}</span>
            )}
          </div>
        )}
      </div>
      {showCloseButton && (
        <CloseButton onClick={onClose} position={closeButtonPosition} icon={closeIcon} />
      )}
    </div>
  );
};

export default React.memo(StoryHeader);
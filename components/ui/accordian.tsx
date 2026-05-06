// components/ui/accordion.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./accordian.module.css";

// Context Types
type AccordionContextType = {
  expanded: string[];
  toggle: (value: string) => void;
  type: "single" | "multiple";
};

type AccordionItemContextType = {
  value: string;
  isExpanded: boolean;
};

const AccordionContext = createContext<AccordionContextType | null>(null);
const AccordionItemContext = createContext<AccordionItemContextType | null>(null);

function useAccordion() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within an Accordion");
  }
  return context;
}

function useAccordionItem() {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error("AccordionItem must be used within an AccordionItem");
  }
  return context;
}

// Accordion Root
type AccordionProps = {
  type?: "single" | "multiple";
  defaultValue?: string[];
  children: ReactNode;
  className?: string;
};

export function Accordion({
  type = "single",
  defaultValue = [],
  children,
  className,
}: AccordionProps) {
  const [expanded, setExpanded] = useState<string[]>(defaultValue);

  const toggle = useCallback(
    (value: string) => {
      setExpanded((prev) => {
        if (type === "single") {
          return prev.includes(value) ? [] : [value];
        }
        return prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value];
      });
    },
    [type]
  );

  return (
    <AccordionContext.Provider value={{ expanded, toggle, type }}>
      <div className={cn(styles.accordion, className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

// Accordion Item
type AccordionItemProps = {
  value: string;
  children: ReactNode;
  className?: string;
};

export function AccordionItem({ value, children, className }: AccordionItemProps) {
  const { expanded } = useAccordion();
  const isExpanded = expanded.includes(value);

  return (
    <AccordionItemContext.Provider value={{ value, isExpanded }}>
      <div
        className={cn(styles.item, className)}
        data-state={isExpanded ? "open" : "closed"}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

// Accordion Trigger
type AccordionTriggerProps = {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
};

export function AccordionTrigger({
  children,
  className,
  icon,
}: AccordionTriggerProps) {
  const { toggle } = useAccordion();
  const { value, isExpanded } = useAccordionItem();

  return (
    <button
      type="button"
      className={cn(styles.trigger, className)}
      onClick={() => toggle(value)}
      aria-expanded={isExpanded}
      data-state={isExpanded ? "open" : "closed"}
    >
      {icon && <span className={styles.triggerIcon}>{icon}</span>}
      <span className={styles.triggerText}>{children}</span>
      <motion.span
        className={styles.triggerChevron}
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <ChevronDown size={15} />
      </motion.span>
    </button>
  );
}

// Accordion Content
type AccordionContentProps = {
  children: ReactNode;
  className?: string;
};

export function AccordionContent({ children, className }: AccordionContentProps) {
  const { isExpanded } = useAccordionItem();

  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          className={cn(styles.content, className)}
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: "auto",
            opacity: 1,
            transition: {
              height: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.18, delay: 0.08 },
            },
          }}
          exit={{
            height: 0,
            opacity: 0,
            transition: {
              height: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.12 },
            },
          }}
        >
          <div className={styles.contentInner}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
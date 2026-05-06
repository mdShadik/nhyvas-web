import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import styles from "./table.module.css";

export function TableRoot({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(styles.uiTableWrap, className)} {...props} />;
}

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn(styles.uiTable, className)} {...props} />;
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn(styles.uiTableHead, className)} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn(styles.uiTableBody, className)} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn(styles.uiTableRow, className)} {...props} />;
}

export function TableHeadCell({ className, first, last, ...props }: ThHTMLAttributes<HTMLTableCellElement> & { first?: boolean; last?: boolean }) {
  return <th className={cn(styles.uiTableHeadCell, first && styles.uiTableHeadCellFirst, last && styles.uiTableHeadCellLast, className)} {...props} />;
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn(styles.uiTableCell, className)} {...props} />;
}


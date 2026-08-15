import React from "react";
import clsx from "clsx";
import { tableScrollClass, tableShellClass } from "@/components/common/table-styles";

interface TableProps {
  children: React.ReactNode;
  className?: string;
  toolbar?: React.ReactNode;
  /** Skips outer shell when a parent wrapper already provides the card border. */
  embedded?: boolean;
}

/**
 * Wrapper + overflow; optional toolbar surface above the grid (`TableToolbar`).
 */
export default function Table({
  children,
  className,
  toolbar = null,
  embedded = false,
}: TableProps) {
  const content = (
    <>
      {toolbar}

      <div className={tableScrollClass}>
        <table
          className={clsx("min-w-full table-auto border-collapse", className)}
        >
          {children}
        </table>
      </div>
    </>
  );

  if (embedded) return content;

  return <div className={tableShellClass}>{content}</div>;
}

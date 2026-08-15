"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import { tableToolbarClass } from "@/components/common/table-styles";
import TableViewTabs from "@/components/common/table-view-tabs";
import { interactiveTriggerCompactClass } from "@/components/common/interactive-list-styles";

export const tableToolbarControlClass =
  "min-h-9 w-full min-w-48 rounded-none border border-light-border bg-light-surface px-3 py-2 text-sm text-light-text placeholder:text-light-muted transition-[border-color,box-shadow] duration-200 hover:border-primary-500 focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text dark:placeholder:text-dark-muted dark:hover:border-primary-500 sm:max-w-xs";

export const tableToolbarIconButtonClass =
  "inline-flex items-center gap-1.5 rounded-none border border-transparent px-2.5 py-1.5 text-[11px] font-semibold text-light-muted transition-colors duration-200 hover:border-primary-500 hover:bg-primary-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 disabled:cursor-not-allowed disabled:opacity-60 dark:text-dark-muted dark:hover:border-primary-500 dark:hover:bg-primary-500 dark:hover:text-white";

type TableToolbarProps = {
  children: ReactNode;
  className?: string;
};

type ToolbarRowProps = {
  children: ReactNode;
  className?: string;
  justify?: "between" | "start" | "end";
};

type ToolbarSectionProps = {
  children: ReactNode;
  className?: string;
};

type ToolbarIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  icon: ReactNode;
  iconOnly?: boolean;
};

export type TableViewTab = {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
};

function TableToolbarRoot({ children, className }: TableToolbarProps) {
  return (
    <div className={clsx(tableToolbarClass, className)}>{children}</div>
  );
}

function ToolbarRow({
  children,
  className,
  justify = "between",
}: ToolbarRowProps) {
  return (
    <div
      className={clsx(
        "flex flex-wrap items-center gap-x-2 gap-y-2",
        justify === "between" && "justify-between",
        justify === "start" && "justify-start",
        justify === "end" && "justify-end",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ToolbarSection({ children, className }: ToolbarSectionProps) {
  return (
    <div
      className={clsx(
        "flex flex-wrap items-center gap-1.5 sm:gap-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ToolbarIconButton({
  children,
  icon,
  iconOnly = false,
  type = "button",
  className,
  ...rest
}: ToolbarIconButtonProps) {
  if (iconOnly) {
    return (
      <button
        type={type}
        className={clsx(
          "inline-flex h-10 w-10 items-center justify-center rounded-none border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 disabled:cursor-not-allowed disabled:opacity-60",
          interactiveTriggerCompactClass,
          className,
        )}
        {...rest}
      >
        <span className="inline-flex shrink-0">{icon}</span>
      </button>
    );
  }

  return (
    <button
      type={type}
      className={clsx(tableToolbarIconButtonClass, className)}
      {...rest}
    >
      <span className="inline-flex shrink-0 opacity-90">{icon}</span>
      {children ? <span>{children}</span> : null}
    </button>
  );
}

type TableToolbarComponent = typeof TableToolbarRoot & {
  Row: typeof ToolbarRow;
  Section: typeof ToolbarSection;
  IconButton: typeof ToolbarIconButton;
  ViewTabs: typeof TableViewTabs;
};

const TableToolbar = TableToolbarRoot as TableToolbarComponent;

TableToolbar.Row = ToolbarRow;
TableToolbar.Section = ToolbarSection;
TableToolbar.IconButton = ToolbarIconButton;
TableToolbar.ViewTabs = TableViewTabs;

export default TableToolbar;

"use client";

import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import clsx from "clsx";
import {
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownLinkItem,
  DropdownMenuRoot,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/common/dropdown-menu";
import {
  interactiveTriggerCompactClass,
} from "@/components/common/interactive-list-styles";
import { tableToolbarIconClass } from "@/components/common/table-toolbar-icons";
import { useI18n } from "@/lib/i18n";

export type TableRowActionVariant = "default" | "danger" | "success" | "warning";

export type TableRowActionItem = {
  id: string;
  label: ReactNode;
  icon?: LucideIcon;
  href?: string;
  onSelect?: () => void;
  variant?: TableRowActionVariant;
  disabled?: boolean;
  hidden?: boolean;
};

export type TableRowActionCategory = {
  label?: string;
  items: TableRowActionItem[];
};

export type TableRowActionsMenuProps = {
  categories: TableRowActionCategory[];
  triggerAriaLabel?: string;
  align?: "start" | "center" | "end";
  contentClassName?: string;
  triggerClassName?: string;
};

function ActionIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className={tableToolbarIconClass} strokeWidth={1.75} aria-hidden />;
}

function renderActionItem(item: TableRowActionItem) {
  if (item.hidden) return null;

  const icon = item.icon ? <ActionIcon icon={item.icon} /> : undefined;

  if (item.href) {
    return (
      <DropdownLinkItem
        key={item.id}
        href={item.href}
        icon={icon}
        variant={item.variant}
        onSelect={item.onSelect}
      >
        {item.label}
      </DropdownLinkItem>
    );
  }

  return (
    <DropdownItem
      key={item.id}
      icon={icon}
      variant={item.variant}
      disabled={item.disabled}
      onSelect={item.onSelect}
    >
      {item.label}
    </DropdownItem>
  );
}

export default function TableRowActionsMenu({
  categories,
  triggerAriaLabel = "Row actions",
  align = "end",
  contentClassName,
  triggerClassName,
}: TableRowActionsMenuProps) {
  const { direction } = useI18n();
  const visibleCategories = categories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => !item.hidden),
    }))
    .filter((category) => category.items.length > 0);

  if (visibleCategories.length === 0) {
    return null;
  }

  return (
    <DropdownMenuRoot dir={direction}>
      <DropdownTrigger
        compact
        showArrow={false}
        aria-label={triggerAriaLabel}
        className={clsx(interactiveTriggerCompactClass, triggerClassName)}
      >
        <span className="flex h-full w-full items-center justify-center">
          <MoreHorizontal
            className={clsx(
              tableToolbarIconClass,
              "transition-transform duration-200 ease-out group-data-[state=open]/trigger:rotate-90 group-data-[state=open]/trigger:scale-110",
            )}
            strokeWidth={1.75}
            aria-hidden
          />
        </span>
      </DropdownTrigger>
      <DropdownContent
        align={align}
        className={clsx(
          "w-56 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-1",
          contentClassName,
        )}
      >
        {visibleCategories.map((category, categoryIndex) => (
          <div key={category.label ?? `category-${categoryIndex}`}>
            {categoryIndex > 0 ? <DropdownSeparator /> : null}
            {category.label ? (
              <DropdownLabel>{category.label}</DropdownLabel>
            ) : null}
            {category.items.map((item) => renderActionItem(item))}
          </div>
        ))}
      </DropdownContent>
    </DropdownMenuRoot>
  );
}

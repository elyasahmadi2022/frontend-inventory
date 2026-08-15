import { type LucideIcon } from "lucide-react";
import {
  ArrowDownUp,
  Columns3,
  Filter,
  LayoutList,
} from "lucide-react";
import { type ReactNode } from "react";
import {
  interactiveTabActiveClass,
  interactiveTabClass,
  interactiveTriggerCompactClass,
} from "@/components/common/interactive-list-styles";

/** Consistent stroke/size for toolbar and header table icons. */
export const tableToolbarIconClass = "size-[18px] shrink-0";

export const tableHeaderIconClass = "size-3.5 shrink-0";

export function TableToolbarIcon({
  icon: Icon,
  className = tableToolbarIconClass,
}: {
  icon: LucideIcon;
  className?: string;
}) {
  return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}

export function TableHeaderIcon({
  icon: Icon,
  className = tableHeaderIconClass,
}: {
  icon: LucideIcon;
  className?: string;
}) {
  return <Icon className={className} strokeWidth={2} aria-hidden />;
}

export const tableToolbarDefaultIcons = {
  filter: <TableToolbarIcon icon={Filter} />,
  sort: <TableToolbarIcon icon={ArrowDownUp} />,
  columns: <TableToolbarIcon icon={Columns3} />,
  display: <TableToolbarIcon icon={LayoutList} />,
} satisfies Record<string, ReactNode>;

export const tableToolbarDropdownTriggerClass = interactiveTriggerCompactClass;

export const tableToolbarTabClass = interactiveTabClass;

export const tableToolbarTabActiveClass = interactiveTabActiveClass;

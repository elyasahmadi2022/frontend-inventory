"use client";

import { type ReactNode } from "react";
import clsx from "clsx";
import {
  DropdownCheckboxItem,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownMenuRoot,
  DropdownRadioGroup,
  DropdownRadioItem,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/common/dropdown-menu";
import TableToolbar from "@/components/common/table-tool-bar";
import {
  tableToolbarDefaultIcons,
  tableToolbarIconClass,
} from "@/components/common/table-toolbar-icons";
import {
  interactiveDropdownPanelClass,
} from "@/components/common/interactive-list-styles";

export type TableToolColumnDef = {
  id: string;
  label: string;
  required?: boolean;
};

export type TableToolOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

export type TableToolDropdownsProps = {
  labels?: {
    filter?: string;
    sort?: string;
    columns?: string;
    hide?: string;
  };
  icons?: {
    filter?: ReactNode;
    sort?: ReactNode;
    columns?: ReactNode;
    hide?: ReactNode;
  };
  statusOptions?: TableToolOption[];
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  sortOptions?: TableToolOption[];
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSortChange?: (key: string, direction: "asc" | "desc") => void;
  columns?: TableToolColumnDef[];
  hiddenColumns?: string[];
  onToggleColumn?: (id: string) => void;
  onResetColumns?: () => void;
  compactRows?: boolean;
  onToggleCompactRows?: () => void;
  className?: string;
};

function ToolbarDropdownTrigger({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <DropdownTrigger compact showArrow={false} aria-label={label} title={label}>
      <span className="flex h-full w-full items-center justify-center">{icon}</span>
    </DropdownTrigger>
  );
}

const tableToolDropdownPanelClass = clsx(interactiveDropdownPanelClass, "min-w-0");

export default function TableToolDropdowns({
  labels,
  icons,
  statusOptions,
  statusFilter,
  onStatusFilterChange,
  sortOptions,
  sortKey,
  sortDirection = "asc",
  onSortChange,
  columns,
  hiddenColumns = [],
  onToggleColumn,
  onResetColumns,
  compactRows = false,
  onToggleCompactRows,
  className,
}: TableToolDropdownsProps) {
  const hiddenSet = new Set(hiddenColumns);
  const resolvedIcons = {
    filter: icons?.filter ?? tableToolbarDefaultIcons.filter,
    sort: icons?.sort ?? tableToolbarDefaultIcons.sort,
    columns: icons?.columns ?? tableToolbarDefaultIcons.columns,
    hide: icons?.hide ?? tableToolbarDefaultIcons.display,
  };

  const showFilter =
    statusOptions != null &&
    statusFilter != null &&
    typeof onStatusFilterChange === "function";
  const showSort =
    sortOptions != null &&
    sortKey != null &&
    typeof onSortChange === "function";
  const showColumns =
    columns != null &&
    typeof onToggleColumn === "function" &&
    columns.length > 0;
  const showHide = typeof onToggleCompactRows === "function";

  if (!showFilter && !showSort && !showColumns && !showHide) {
    return null;
  }

  return (
    <TableToolbar.Section className={clsx("gap-1", className)}>
      {showFilter ? (
        <DropdownMenuRoot>
          <ToolbarDropdownTrigger
            icon={resolvedIcons.filter}
            label={labels?.filter ?? "Filter"}
          />
          <DropdownContent align="end" className={clsx(tableToolDropdownPanelClass, "w-52")}>
            <DropdownLabel>{labels?.filter ?? "Filter"}</DropdownLabel>
            <DropdownRadioGroup
              value={statusFilter}
              onValueChange={onStatusFilterChange}
            >
              {statusOptions.map((option) => (
                <DropdownRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownRadioItem>
              ))}
            </DropdownRadioGroup>
          </DropdownContent>
        </DropdownMenuRoot>
      ) : null}

      {showSort ? (
        <DropdownMenuRoot>
          <ToolbarDropdownTrigger
            icon={resolvedIcons.sort}
            label={labels?.sort ?? "Sort"}
          />
          <DropdownContent align="end" className={clsx(tableToolDropdownPanelClass, "w-56")}>
            <DropdownLabel>{labels?.sort ?? "Sort by"}</DropdownLabel>
            <DropdownRadioGroup
              value={sortKey}
              onValueChange={(value) => onSortChange(value, sortDirection)}
            >
              {sortOptions.map((option) => (
                <DropdownRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownRadioItem>
              ))}
            </DropdownRadioGroup>
            <DropdownSeparator />
            <DropdownLabel>Direction</DropdownLabel>
            <DropdownRadioGroup
              value={sortDirection}
              onValueChange={(value) =>
                onSortChange(sortKey, value as "asc" | "desc")
              }
            >
              <DropdownRadioItem value="asc">Ascending</DropdownRadioItem>
              <DropdownRadioItem value="desc">Descending</DropdownRadioItem>
            </DropdownRadioGroup>
          </DropdownContent>
        </DropdownMenuRoot>
      ) : null}

      {showColumns ? (
        <DropdownMenuRoot>
          <ToolbarDropdownTrigger
            icon={resolvedIcons.columns}
            label={labels?.columns ?? "Columns"}
          />
          <DropdownContent align="end" className={clsx(tableToolDropdownPanelClass, "w-56")}>
            <DropdownLabel>{labels?.columns ?? "Columns"}</DropdownLabel>
            {columns.map((column) => (
              <DropdownCheckboxItem
                key={column.id}
                checked={!hiddenSet.has(column.id)}
                disabled={column.required}
                onCheckedChange={() => onToggleColumn(column.id)}
                onSelect={(event) => event.preventDefault()}
              >
                {column.label}
              </DropdownCheckboxItem>
            ))}
            {onResetColumns ? (
              <>
                <DropdownSeparator />
                <DropdownItem onSelect={() => onResetColumns()}>
                  Reset columns
                </DropdownItem>
              </>
            ) : null}
          </DropdownContent>
        </DropdownMenuRoot>
      ) : null}

      {showHide ? (
        <DropdownMenuRoot>
          <ToolbarDropdownTrigger
            icon={resolvedIcons.hide}
            label={labels?.hide ?? "Display"}
          />
          <DropdownContent align="end" className={clsx(tableToolDropdownPanelClass, "w-48")}>
            <DropdownLabel>{labels?.hide ?? "Display"}</DropdownLabel>
            <DropdownCheckboxItem
              checked={compactRows}
              onCheckedChange={() => onToggleCompactRows()}
              onSelect={(event) => event.preventDefault()}
            >
              Compact rows
            </DropdownCheckboxItem>
          </DropdownContent>
        </DropdownMenuRoot>
      ) : null}
    </TableToolbar.Section>
  );
}

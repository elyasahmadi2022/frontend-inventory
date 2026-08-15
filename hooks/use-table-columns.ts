"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { TableHeaderItem } from "@/components/common/table-header";
import type { TableToolColumnDef } from "@/components/common/table-tool-dropdowns";

export type TableColumnDef = {
  id: string;
  title: ReactNode;
  required?: boolean;
  tooltip?: string;
  icon?: ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
  /** Fixed column width (e.g. `5rem`) for header/body alignment. */
  width?: string;
};

export function useTableColumns(columns: TableColumnDef[]) {
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(
    () => new Set(),
  );

  const visibleColumns = useMemo(
    () => columns.filter((column) => !hiddenColumns.has(column.id)),
    [columns, hiddenColumns],
  );
  const headerData = useMemo<TableHeaderItem[]>(
    () =>
      visibleColumns.map((column) => ({
        title: column.title,
        tooltip: column.tooltip,
        icon: column.icon,
        align: column.align,
        className: column.className,
        width: column.width,
      })),
    [visibleColumns],
  );

  const toolColumns = useMemo<TableToolColumnDef[]>(
    () =>
      columns.map((column) => ({
        id: column.id,
        label: typeof column.title === "string" ? column.title : column.id,
        required: column.required,
      })),
    [columns],
  );

  const isColumnVisible = useCallback(
    (id: string) => !hiddenColumns.has(id),
    [hiddenColumns],
  );

  const toggleColumn = useCallback((id: string) => {
    setHiddenColumns((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const resetColumns = useCallback(() => {
    setHiddenColumns(new Set());
  }, []);

  return {
    hiddenColumns,
    hiddenColumnsList: [...hiddenColumns],
    headerData,
    toolColumns,
    isColumnVisible,
    toggleColumn,
    resetColumns,
    visibleColumnCount: visibleColumns.length,
  };
}

"use client";

import { useCallback, useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

export function sortTableItems<T>(
  items: T[],
  sortKey: string,
  sortDirection: SortDirection,
  accessors: Record<string, (item: T) => string | number>,
): T[] {
  const getValue = accessors[sortKey] ?? Object.values(accessors)[0];
  if (!getValue) return items;

  return [...items].sort((left, right) => {
    const leftValue = getValue(left);
    const rightValue = getValue(right);
    const result =
      typeof leftValue === "number" && typeof rightValue === "number"
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue), undefined, {
            numeric: true,
            sensitivity: "base",
          });
    return sortDirection === "desc" ? -result : result;
  });
}

export function useTableSort<T>(
  items: T[],
  accessors: Record<string, (item: T) => string | number>,
  defaultSortKey: string,
  defaultSortDirection: SortDirection = "asc",
) {
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(defaultSortDirection);

  const sortedItems = useMemo(
    () => sortTableItems(items, sortKey, sortDirection, accessors),
    [accessors, items, sortDirection, sortKey],
  );

  const onSortChange = useCallback(
    (key: string, direction: SortDirection) => {
      setSortKey(key);
      setSortDirection(direction);
    },
    [],
  );

  const resetSort = useCallback(() => {
    setSortKey(defaultSortKey);
    setSortDirection(defaultSortDirection);
  }, [defaultSortDirection, defaultSortKey]);

  return {
    sortKey,
    sortDirection,
    sortedItems,
    onSortChange,
    resetSort,
    setSortKey,
    setSortDirection,
  };
}

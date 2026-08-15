"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { SelectField } from "@/components/common/select-field";
import {
  getPaginationRange,
  getPaginationSummary,
  type PaginationMeta,
} from "@/lib/pagination";

type PaginationProps = {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
  className?: string;
};

const navButtonClass =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-none border border-light-border bg-light-surface px-2 text-sm font-medium text-light-text transition hover:bg-light-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text dark:hover:bg-dark-bg";

export default function Pagination({
  meta,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  disabled = false,
  className = "",
}: PaginationProps) {
  const range = getPaginationRange(meta.page, meta.totalPages);
  const pageSizeSelect = onPageSizeChange ? (
    <div className="flex items-center gap-2">
      <span className="text-xs text-light-muted dark:text-dark-muted">Rows</span>
      <SelectField
        options={pageSizeOptions.map((value) => ({
          value: String(value),
          label: String(value),
        }))}
        value={String(meta.pageSize)}
        onValueChange={(value) => onPageSizeChange(Number(value))}
        tone="light"
        clearable={false}
        disabled={disabled}
        className="min-h-9 w-24"
        contentClassName="z-[1200]"
      />
    </div>
  ) : null;

  if (meta.totalPages <= 1 && meta.total <= meta.pageSize) {
    return (
      <div
        className={`flex flex-col gap-3 border-t border-light-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
      >
        <span className="text-xs text-light-muted dark:text-dark-muted">
          {getPaginationSummary(meta)}
        </span>
        {pageSizeSelect}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-3 border-t border-light-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-dark-border ${className}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-xs text-light-muted dark:text-dark-muted">
          {getPaginationSummary(meta)}
        </p>
        {pageSizeSelect}
      </div>

      <nav
        className="flex items-center gap-1"
        aria-label="Pagination"
      >
        <button
          type="button"
          className={navButtonClass}
          onClick={() => onPageChange(meta.page - 1)}
          disabled={disabled || meta.page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        {range.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-sm text-light-muted dark:text-dark-muted"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`${navButtonClass} ${
                item === meta.page
                  ? "border-primary-500 bg-primary-500 text-white hover:bg-primary-600 dark:hover:bg-primary-600"
                  : ""
              }`}
              onClick={() => onPageChange(item)}
              disabled={disabled || item === meta.page}
              aria-current={item === meta.page ? "page" : undefined}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          className={navButtonClass}
          onClick={() => onPageChange(meta.page + 1)}
          disabled={disabled || meta.page >= meta.totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}

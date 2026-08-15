export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function buildClientPagination(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number,
  apiPagination?: PaginationMeta | null,
): { pageItems: T[]; meta: PaginationMeta } {
  if (apiPagination) {
    return { pageItems: items, meta: apiPagination };
  }

  const meta = buildClientPagination(items.length, page, pageSize);
  const start = (meta.page - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    meta,
  };
}

export function getPaginationRange(
  page: number,
  totalPages: number,
  siblingCount = 1,
): Array<number | "ellipsis"> {
  if (totalPages <= 1) return [1];

  const pages = new Set<number>([1, totalPages, page]);
  for (let offset = 1; offset <= siblingCount; offset += 1) {
    if (page - offset > 1) pages.add(page - offset);
    if (page + offset < totalPages) pages.add(page + offset);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const range: Array<number | "ellipsis"> = [];

  sorted.forEach((value, index) => {
    const previous = sorted[index - 1];
    if (previous != null && value - previous > 1) {
      range.push("ellipsis");
    }
    range.push(value);
  });

  return range;
}

export function getPaginationSummary(meta: PaginationMeta): string {
  if (meta.total === 0) return "No results";
  const start = (meta.page - 1) * meta.pageSize + 1;
  const end = Math.min(meta.page * meta.pageSize, meta.total);
  return `Showing ${start}–${end} of ${meta.total}`;
}

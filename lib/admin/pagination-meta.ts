import type { PaginationMeta } from "@/lib/pagination";
import type { ProductPagination } from "@/services/products.service";

export function toPaginationMeta(
  pagination: ProductPagination | null | undefined,
): PaginationMeta | null {
  if (!pagination) return null;
  return {
    page: pagination.page,
    pageSize: pagination.limit,
    total: pagination.total,
    totalPages: pagination.totalPages,
  };
}

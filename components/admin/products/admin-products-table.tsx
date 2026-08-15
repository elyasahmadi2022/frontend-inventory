"use client";

import clsx from "clsx";
import { Edit, Power, PowerOff, Plus, RefreshCw, Trash2 } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { useMemo, useState } from "react";
import { AdminProductModal } from "@/components/admin/products/admin-product-modal";
import { ConfirmModal } from "@/components/common/confirm-modal";
import DataTableEmptyState from "@/components/common/data-table-empty-state";
import { InputField } from "@/components/common/input-field";
import Pagination from "@/components/common/pagination";
import { SelectField } from "@/components/common/select-field";
import StatusPill from "@/components/common/status-pill";
import TableRowActionsMenu from "@/components/common/table-row-actions-menu";
import Table from "@/components/common/table";
import TableBody from "@/components/common/table-body";
import TableColumn from "@/components/common/table-column";
import TableHeader from "@/components/common/table-header";
import TableRow from "@/components/common/table-row";
import TableToolbar from "@/components/common/table-tool-bar";
import TableToolDropdowns from "@/components/common/table-tool-dropdowns";
import {
  TableToolbarIcon,
  tableToolbarIconClass,
} from "@/components/common/table-toolbar-icons";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTableSort } from "@/hooks/use-table-sort";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { PaginationMeta } from "@/lib/pagination";
import { useDeleteAdminProductMutation, useUpdateAdminProductMutation } from "@/lib/query/hooks";
import type {
  ProductCategoryRow,
  ProductRow,
  UnitRow,
} from "@/services/products.service";

type Props = {
  categories: ProductCategoryRow[];
  items: ProductRow[];
  loading?: boolean;
  pagination?: PaginationMeta | null;
  refreshing?: boolean;
  units: UnitRow[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRefresh: () => void;
};

function numberLabel(value: string | number | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed.toLocaleString() : "0";
}

const productSortAccessors = {
  sku: (row: ProductRow) => row.sku,
  name: (row: ProductRow) => row.name,
  category: (row: ProductRow) => row.category?.name ?? "",
  salePrice: (row: ProductRow) => Number(row.defaultSalePrice ?? 0),
};

function availableUnitsLabel(row: ProductRow) {
  const units = row.availableUnits ?? [];
  if (units.length === 0) return row.baseUnit?.code ?? "-";
  return units
    .map((item) => item.unit?.code ?? item.code ?? item.unit?.name ?? item.name)
    .filter(Boolean)
    .join(", ");
}

export function AdminProductsTable({
  categories,
  items,
  loading = false,
  pagination,
  refreshing = false,
  units,
  onPageChange,
  onPageSizeChange,
  onRefresh,
}: Props) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [status, setStatus] = useState("all");
  const [categoryId, setCategoryId] = useState("");
  const [compactRows, setCompactRows] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const updateProductMutation = useUpdateAdminProductMutation();
  const deleteProductMutation = useDeleteAdminProductMutation();

  const categoryOptions = useMemo(
    () => [
      { value: "", label: t("admin.products.filter.allCategories") },
      ...categories.map((category) => ({ value: category.id, label: category.name })),
    ],
    [categories, t],
  );
  const statusOptions = useMemo(
    () => [
      { value: "all", label: t("admin.products.status.all") },
      { value: "active", label: t("admin.products.status.active") },
      { value: "inactive", label: t("admin.products.status.inactive") },
    ],
    [t],
  );
  const sortOptions = useMemo(
    () => [
      { value: "sku", label: t("admin.products.column.sku") },
      { value: "name", label: t("admin.products.column.product") },
      { value: "category", label: t("admin.products.column.category") },
      { value: "salePrice", label: t("admin.products.column.salePrice") },
    ],
    [t],
  );

  const filteredItems = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return items.filter((item) => {
      if (status === "active" && !item.isActive) return false;
      if (status === "inactive" && item.isActive) return false;
      if (categoryId && item.categoryId !== categoryId) return false;
      if (!query) return true;
      return [item.name, item.sku, item.barcode, item.category?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [categoryId, debouncedSearch, items, status]);

  const headerData = [
    { title: t("admin.products.column.sku") },
    { title: t("admin.products.column.product") },
    { title: t("admin.products.column.category") },
    { title: t("admin.products.column.unit") },
    { title: t("admin.products.column.availableUnits") },
    { title: t("admin.products.column.standardCost") },
    { title: t("admin.products.column.salePrice") },
    { title: t("admin.products.column.status") },
    { title: t("admin.products.column.actions"), align: "center" as const },
  ];
  const { sortKey, sortDirection, sortedItems, onSortChange } = useTableSort(
    filteredItems,
    productSortAccessors,
    "name",
  );

  const editProduct = (row: ProductRow) => {
    setEditing(row);
    setModalOpen(true);
  };

  const toggleProductStatus = async (row: ProductRow) => {
    setBusyProductId(row.id);
    try {
      const saved = await updateProductMutation.mutateAsync({
        id: row.id,
        input: { isActive: !row.isActive },
      });
      gooeyToast.success(
        saved.isActive
          ? t("admin.products.product.activatedTitle")
          : t("admin.products.product.deactivatedTitle"),
        {
          description: t("admin.products.product.statusSavedDescription", {
            name: saved.name,
          }),
        },
      );
    } catch (error) {
      gooeyToast.error(t("admin.products.product.statusFailedTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.products.product.statusFailedFallback"),
      });
    } finally {
      setBusyProductId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyProductId(deleteTarget.id);
    try {
      await deleteProductMutation.mutateAsync(deleteTarget.id);
      gooeyToast.success(t("admin.products.product.deleteSuccessTitle"), {
        description: t("admin.products.product.deleteSuccessDescription", {
          name: deleteTarget.name,
        }),
      });
      setDeleteTarget(null);
    } catch (error) {
      gooeyToast.error(t("admin.products.product.deleteErrorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.products.product.deleteErrorFallback"),
      });
    } finally {
      setBusyProductId(null);
    }
  };

  if (loading) {
    return (
      <div className="border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
        <div className="h-40 animate-pulse bg-light-border dark:bg-dark-border" />
      </div>
    );
  }

  return (
    <>
      <ConfirmModal
        open={deleteTarget != null}
        title={t("admin.products.product.deleteConfirmTitle")}
        description={t("admin.products.product.deleteConfirmDescription", {
          name: deleteTarget?.name ?? "",
        })}
        confirmLabel={t("admin.products.product.deleteConfirm")}
        cancelLabel={t("admin.products.product.deleteCancel")}
        closeLabel={t("admin.products.product.deleteClose")}
        workingLabel={t("admin.products.product.deleteWorking")}
        tone="danger"
        submitting={deleteProductMutation.isPending}
        onClose={() => {
          if (!deleteProductMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
      <AdminProductModal
        categories={categories}
        units={units}
        product={editing}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      />
      <div className="overflow-hidden border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <Table
          toolbar={
            <TableToolbar>
              <TableToolbar.Row justify="between">
                <TableToolbar.Section>
                  <span className="text-xs font-semibold text-light-muted dark:text-dark-muted">
                    {t("admin.products.table.count", {
                      filtered: filteredItems.length,
                      total: items.length,
                    })}
                  </span>
                  <TableToolbar.IconButton
                    iconOnly
                    icon={
                      <TableToolbarIcon
                        icon={RefreshCw}
                        className={clsx(
                          tableToolbarIconClass,
                          refreshing && "animate-spin",
                        )}
                      />
                    }
                    onClick={onRefresh}
                    disabled={refreshing}
                    aria-label={t("admin.products.action.refresh")}
                    title={t("admin.products.action.refresh")}
                  />
                </TableToolbar.Section>
                <button
                  type="button"
                  className="btn-primary inline-flex min-h-10 items-center gap-2"
                  onClick={() => setModalOpen(true)}
                >
                  <Plus className="size-4" />
                  {t("admin.products.action.newProduct")}
                </button>
              </TableToolbar.Row>
              <TableToolbar.Row justify="start">
                <div className="min-w-0 flex-1 sm:min-w-56">
                  <InputField
                    id="admin-products-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("admin.products.searchPlaceholder")}
                    tone="light"
                    containerClassName="mb-0"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <SelectField
                    options={statusOptions}
                    value={status}
                    onValueChange={setStatus}
                    tone="light"
                    clearable={false}
                  />
                </div>
                <div className="w-full sm:w-56">
                  <SelectField
                    options={categoryOptions}
                    value={categoryId}
                    onValueChange={setCategoryId}
                    tone="light"
                    searchable
                    clearable={false}
                  />
                </div>
                <TableToolDropdowns
                  labels={{
                    filter: t("admin.users.tools.filter"),
                    sort: t("admin.users.tools.sort"),
                    columns: t("admin.users.tools.columns"),
                    hide: t("admin.users.tools.display"),
                  }}
                  statusOptions={statusOptions}
                  statusFilter={status}
                  onStatusFilterChange={setStatus}
                  sortOptions={sortOptions}
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSortChange={onSortChange}
                  compactRows={compactRows}
                  onToggleCompactRows={() => setCompactRows((value) => !value)}
                />
              </TableToolbar.Row>
            </TableToolbar>
          }
        >
          <TableHeader headerData={headerData} />
          <TableBody>
            {sortedItems.length === 0 ? (
              <DataTableEmptyState
                colSpan={headerData.length}
                title={t("admin.products.empty.products")}
              />
            ) : (
              sortedItems.map((row) => (
                <TableRow key={row.id} className={compactRows ? "[&_td]:py-2" : undefined}>
                  <TableColumn>
                    <span className="font-mono text-xs font-semibold">
                      {row.sku}
                    </span>
                  </TableColumn>
                  <TableColumn nowrap={false}>
                    <p className="font-semibold text-light-text dark:text-dark-text">
                      {row.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {row.barcode || t("admin.products.product.noBarcode")}
                    </p>
                  </TableColumn>
                  <TableColumn>{row.category?.name ?? "—"}</TableColumn>
                  <TableColumn>{row.baseUnit?.code ?? "—"}</TableColumn>
                  <TableColumn nowrap={false}>{availableUnitsLabel(row)}</TableColumn>
                  <TableColumn>
                    {numberLabel(row.standardCost)} {row.preferredPurchaseCurrency}
                  </TableColumn>
                  <TableColumn>
                    {numberLabel(row.defaultSalePrice)} {row.preferredSaleCurrency}
                  </TableColumn>
                  <TableColumn>
                    <StatusPill
                      label={
                        row.isActive
                          ? t("admin.products.status.active")
                          : t("admin.products.status.inactive")
                      }
                      variant={row.isActive ? "success" : "neutral"}
                    />
                  </TableColumn>
                  <TableColumn className="text-center">
                    <TableRowActionsMenu
                      triggerAriaLabel={t("admin.products.actions.trigger", {
                        name: row.name,
                      })}
                      categories={[
                        {
                          label: t("admin.products.actions.product"),
                          items: [
                            {
                              id: "edit",
                              label: t("admin.products.action.editProduct"),
                              icon: Edit,
                              onSelect: () => editProduct(row),
                            },
                            {
                              id: "toggle-status",
                              label: row.isActive
                                ? t("admin.products.action.deactivateProduct")
                                : t("admin.products.action.activateProduct"),
                              icon: row.isActive ? PowerOff : Power,
                              variant: row.isActive ? "warning" : "success",
                              disabled:
                                updateProductMutation.isPending &&
                                busyProductId === row.id,
                              onSelect: () => void toggleProductStatus(row),
                            },
                            {
                              id: "delete",
                              label: t("admin.products.action.deleteProduct"),
                              icon: Trash2,
                              variant: "danger",
                              disabled:
                                deleteProductMutation.isPending &&
                                busyProductId === row.id,
                              onSelect: () => setDeleteTarget(row),
                            },
                          ],
                        },
                      ]}
                    />
                  </TableColumn>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {pagination ? (
          <Pagination
            meta={pagination}
            onPageChange={(nextPage) => onPageChange?.(nextPage)}
            onPageSizeChange={onPageSizeChange}
            disabled={refreshing}
          />
        ) : null}
      </div>
    </>
  );
}

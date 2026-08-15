"use client";

import { Edit, FolderTree, Plus, Trash2 } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { useState } from "react";
import { AdminProductCategoryModal } from "@/components/admin/products/admin-product-category-modal";
import { ConfirmModal } from "@/components/common/confirm-modal";
import DataTableEmptyState from "@/components/common/data-table-empty-state";
import TableRowActionsMenu from "@/components/common/table-row-actions-menu";
import Table from "@/components/common/table";
import TableBody from "@/components/common/table-body";
import TableColumn from "@/components/common/table-column";
import TableHeader from "@/components/common/table-header";
import TableRow from "@/components/common/table-row";
import TableToolbar from "@/components/common/table-tool-bar";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useDeleteAdminProductCategoryMutation } from "@/lib/query/hooks";
import type { ProductCategoryRow } from "@/services/products.service";

type Props = {
  items: ProductCategoryRow[];
  loading?: boolean;
};

export function AdminProductCategoriesTable({ items, loading = false }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductCategoryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductCategoryRow | null>(null);
  const deleteCategoryMutation = useDeleteAdminProductCategoryMutation();
  const headerData = [
    { title: t("admin.products.column.category") },
    { title: t("admin.products.category.parent") },
    { title: t("admin.products.category.children") },
    { title: t("admin.products.column.actions"), align: "center" as const },
  ];

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategoryMutation.mutateAsync(deleteTarget.id);
      gooeyToast.success(t("admin.products.category.deleteSuccessTitle"), {
        description: t("admin.products.category.deleteSuccessDescription", {
          name: deleteTarget.name,
        }),
      });
      setDeleteTarget(null);
    } catch (error) {
      gooeyToast.error(t("admin.products.category.deleteErrorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.products.category.deleteErrorFallback"),
      });
    }
  };

  if (loading) {
    return (
      <div className="border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
        <div className="h-28 animate-pulse bg-light-border dark:bg-dark-border" />
      </div>
    );
  }

  return (
    <>
      <ConfirmModal
        open={deleteTarget != null}
        title={t("admin.products.category.deleteConfirmTitle")}
        description={t("admin.products.category.deleteConfirmDescription", {
          name: deleteTarget?.name ?? "",
        })}
        confirmLabel={t("admin.products.category.deleteConfirm")}
        cancelLabel={t("admin.products.category.deleteCancel")}
        closeLabel={t("admin.products.category.deleteClose")}
        workingLabel={t("admin.products.category.deleteWorking")}
        tone="danger"
        submitting={deleteCategoryMutation.isPending}
        onClose={() => {
          if (!deleteCategoryMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
      <AdminProductCategoryModal
        categories={items}
        category={editing}
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
      />
      <div className="overflow-hidden border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <Table
          toolbar={
            <TableToolbar>
              <TableToolbar.Row justify="between">
                <TableToolbar.Section>
                  <FolderTree className="size-4 text-light-muted dark:text-dark-muted" />
                  <span className="text-xs font-semibold text-light-muted dark:text-dark-muted">
                    {t("admin.products.category.count", { count: items.length })}
                  </span>
                </TableToolbar.Section>
                <button
                  type="button"
                  className="btn-primary inline-flex min-h-10 items-center gap-2"
                  onClick={() => setOpen(true)}
                >
                  <Plus className="size-4" />
                  {t("admin.products.action.newCategory")}
                </button>
              </TableToolbar.Row>
            </TableToolbar>
          }
        >
          <TableHeader headerData={headerData} />
          <TableBody>
            {items.length === 0 ? (
              <DataTableEmptyState
                colSpan={headerData.length}
                title={t("admin.products.empty.categories")}
              />
            ) : (
              items.map((row) => (
                <TableRow key={row.id}>
                  <TableColumn>
                    <span className="font-semibold text-light-text dark:text-dark-text">
                      {row.name}
                    </span>
                  </TableColumn>
                  <TableColumn>{row.parent?.name ?? "—"}</TableColumn>
                  <TableColumn>{row.children?.length ?? 0}</TableColumn>
                  <TableColumn className="text-center">
                    <TableRowActionsMenu
                      triggerAriaLabel={t("admin.products.actions.trigger", {
                        name: row.name,
                      })}
                      categories={[
                        {
                          label: t("admin.products.actions.category"),
                          items: [
                            {
                              id: "edit",
                              label: t("admin.products.action.editCategory"),
                              icon: Edit,
                              onSelect: () => {
                                setEditing(row);
                                setOpen(true);
                              },
                            },
                            {
                              id: "delete",
                              label: t("admin.products.action.deleteCategory"),
                              icon: Trash2,
                              variant: "danger",
                              disabled: deleteCategoryMutation.isPending,
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
      </div>
    </>
  );
}

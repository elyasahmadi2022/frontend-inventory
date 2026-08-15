"use client";

import { Boxes, Eye, MapPin, Plus, Trash2 } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { useState } from "react";
import { AdminInventoryLocationModal } from "@/components/admin/products/admin-inventory-location-modal";
import { ConfirmModal } from "@/components/common/confirm-modal";
import DataTableEmptyState from "@/components/common/data-table-empty-state";
import StatusPill from "@/components/common/status-pill";
import Table from "@/components/common/table";
import TableBody from "@/components/common/table-body";
import TableColumn from "@/components/common/table-column";
import TableHeader from "@/components/common/table-header";
import TableRow from "@/components/common/table-row";
import TableRowActionsMenu from "@/components/common/table-row-actions-menu";
import TableToolbar from "@/components/common/table-tool-bar";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useDeleteAdminInventoryLocationMutation } from "@/lib/query/hooks";
import type { InventoryLocationRow } from "@/services/products.service";

type Props = {
  items: InventoryLocationRow[];
  loading?: boolean;
  onViewStock?: (locationId: string) => void;
};

export function AdminInventoryLocationsTable({
  items,
  loading = false,
  onViewStock,
}: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InventoryLocationRow | null>(null);
  const deleteLocationMutation = useDeleteAdminInventoryLocationMutation();
  const headerData = [
    { title: t("admin.products.location.code") },
    { title: t("admin.products.location.name") },
    { title: t("admin.products.stock.locationType") },
    { title: t("admin.products.column.status") },
    { title: t("admin.products.column.actions"), align: "center" as const },
  ];

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLocationMutation.mutateAsync(deleteTarget.id);
      gooeyToast.success(t("admin.products.location.deleteSuccessTitle"), {
        description: t("admin.products.location.deleteSuccessDescription", {
          name: deleteTarget.name,
        }),
      });
      setDeleteTarget(null);
    } catch (error) {
      gooeyToast.error(t("admin.products.location.deleteErrorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.products.location.deleteErrorFallback"),
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
        title={t("admin.products.location.deleteConfirmTitle")}
        description={t("admin.products.location.deleteConfirmDescription", {
          name: deleteTarget?.name ?? "",
        })}
        confirmLabel={t("admin.products.location.deleteConfirm")}
        cancelLabel={t("admin.products.location.deleteCancel")}
        closeLabel={t("admin.products.location.deleteClose")}
        workingLabel={t("admin.products.location.deleteWorking")}
        tone="danger"
        submitting={deleteLocationMutation.isPending}
        onClose={() => {
          if (!deleteLocationMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
      <AdminInventoryLocationModal
        locations={items}
        open={open}
        onClose={() => setOpen(false)}
      />
      <div className="overflow-hidden border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface">
      <Table
        toolbar={
          <TableToolbar>
            <TableToolbar.Row justify="between">
              <TableToolbar.Section>
                <MapPin className="size-4 text-light-muted dark:text-dark-muted" />
                <span className="text-xs font-semibold text-light-muted dark:text-dark-muted">
                  {t("admin.products.location.count", { count: items.length })}
                </span>
              </TableToolbar.Section>
              <button
                type="button"
                className="btn-primary inline-flex min-h-10 items-center gap-2"
                onClick={() => setOpen(true)}
              >
                <Plus className="size-4" />
                {t("admin.products.action.newInventory")}
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
              title={t("admin.products.empty.locations")}
            />
          ) : (
            items.map((row) => (
              <TableRow key={row.id}>
                <TableColumn>
                  <span className="font-mono text-xs font-semibold">
                    {row.code}
                  </span>
                </TableColumn>
                <TableColumn>{row.name}</TableColumn>
                <TableColumn>
                  {row.type
                    ? t(`admin.products.location.type.${row.type === "in_transit" ? "inTransit" : row.type}` as never)
                    : "—"}
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
                        label: t("admin.products.actions.location"),
                        items: [
                          {
                            id: "view-stock",
                            label: t("admin.products.location.viewStock"),
                            icon: Eye,
                            onSelect: () => onViewStock?.(row.id),
                          },
                          {
                            id: "move-stock",
                            label: t("admin.products.stock.moveStock"),
                            icon: Boxes,
                            onSelect: () => onViewStock?.(row.id),
                          },
                          {
                            id: "delete",
                            label: t("admin.products.action.deleteInventory"),
                            icon: Trash2,
                            variant: "danger",
                            disabled: deleteLocationMutation.isPending,
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

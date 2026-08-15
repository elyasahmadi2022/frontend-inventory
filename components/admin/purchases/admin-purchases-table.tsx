"use client";

import clsx from "clsx";
import {
  Banknote,
  Eye,
  PackageMinus,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { gooeyToast } from "goey-toast";
import { useMemo, useState } from "react";
import { AdminCreatePurchaseModal } from "@/components/admin/purchases/admin-create-purchase-modal";
import { AdminPurchasePaymentModal } from "@/components/admin/purchases/admin-purchase-payment-modal";
import { AdminPurchaseReturnModal } from "@/components/admin/purchases/admin-purchase-return-modal";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { FormModal } from "@/components/common/form-modal";
import DataTableEmptyState from "@/components/common/data-table-empty-state";
import { InputField } from "@/components/common/input-field";
import Pagination from "@/components/common/pagination";
import { SelectField } from "@/components/common/select-field";
import StatusPill from "@/components/common/status-pill";
import Table from "@/components/common/table";
import TableBody from "@/components/common/table-body";
import TableColumn from "@/components/common/table-column";
import TableHeader from "@/components/common/table-header";
import TableRow from "@/components/common/table-row";
import TableRowActionsMenu from "@/components/common/table-row-actions-menu";
import TableToolDropdowns from "@/components/common/table-tool-dropdowns";
import TableToolbar from "@/components/common/table-tool-bar";
import {
  TableToolbarIcon,
  tableToolbarIconClass,
} from "@/components/common/table-toolbar-icons";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTableSort } from "@/hooks/use-table-sort";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useCancelAdminPurchaseMutation } from "@/lib/query/hooks";
import { AdminPrintableInvoice } from "@/components/admin/shared/admin-printable-invoice";
import type { PaginationMeta } from "@/lib/pagination";
import type { AccountRow } from "@/services/accounts.service";
import type { PartnerRow } from "@/services/partners.service";
import type {
  InventoryLocationRow,
  ProductRow,
} from "@/services/products.service";
import type { PurchaseRow, PurchaseStatus } from "@/services/purchases.service";

type Props = {
  accounts: AccountRow[];
  items: PurchaseRow[];
  loading?: boolean;
  locations: InventoryLocationRow[];
  pagination?: PaginationMeta | null;
  products: ProductRow[];
  refreshing?: boolean;
  status: PurchaseStatus | "all";
  vendors: PartnerRow[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRefresh: () => void;
  onStatusChange: (status: PurchaseStatus | "all") => void;
};

function money(value: string | number | undefined, currency?: string) {
  const parsed = Number(value ?? 0);
  return `${Number.isFinite(parsed) ? parsed.toLocaleString() : "0"} ${currency ?? ""}`.trim();
}

function statusVariant(status: PurchaseStatus) {
  if (status === "paid") return "success";
  if (status === "partially_paid") return "warning";
  if (status === "cancelled") return "error";
  return "neutral";
}

function dateLabel(value: string | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

const purchaseSortAccessors = {
  number: (row: PurchaseRow) => row.number,
  vendor: (row: PurchaseRow) => row.vendor?.name ?? "",
  date: (row: PurchaseRow) => new Date(row.billDate ?? 0).getTime(),
  total: (row: PurchaseRow) => Number(row.total ?? 0),
  paid: (row: PurchaseRow) => Number(row.paidTotal ?? 0),
};

export function AdminPurchasesTable({
  accounts,
  items,
  loading = false,
  locations,
  pagination,
  products,
  refreshing = false,
  status,
  vendors,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onStatusChange,
}: Props) {
  const { t } = useI18n();
  const cancelMutation = useCancelAdminPurchaseMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PurchaseRow | null>(null);
  const [payTarget, setPayTarget] = useState<PurchaseRow | null>(null);
  const [returnTarget, setReturnTarget] = useState<PurchaseRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseRow | null>(null);
  const [printTarget, setPrintTarget] = useState<PurchaseRow | null>(null);
  const [printLoading, setPrintLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [compactRows, setCompactRows] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);

  const ensurePurchaseLines = async (row: PurchaseRow) => {
    if ((row.lines?.length ?? 0) > 0) return row;
    const { fetchPurchaseByNumber } =
      await import("@/services/purchases.service");
    return fetchPurchaseByNumber(row.number);
  };

  const openPrintPreview = async (row: PurchaseRow) => {
    setPrintTarget(row);
    setPrintLoading(true);
    try {
      setPrintTarget(await ensurePurchaseLines(row));
    } catch (error) {
      gooeyToast.error(t("admin.purchases.toast.loadFailedTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.purchases.toast.loadFailedFallback"),
      });
      setPrintTarget(null);
    } finally {
      setPrintLoading(false);
    }
  };

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t("admin.purchases.status.all") },
      { value: "posted", label: t("admin.purchases.status.posted") },
      {
        value: "partially_paid",
        label: t("admin.purchases.status.partiallyPaid"),
      },
      { value: "paid", label: t("admin.purchases.status.paid") },
      { value: "cancelled", label: t("admin.purchases.status.cancelled") },
    ],
    [t],
  );
  const sortOptions = useMemo(
    () => [
      { value: "number", label: t("admin.purchases.column.number") },
      { value: "vendor", label: t("admin.purchases.column.vendor") },
      { value: "date", label: t("admin.purchases.column.date") },
      { value: "total", label: t("admin.purchases.column.total") },
      { value: "paid", label: t("admin.purchases.column.paid") },
    ],
    [t],
  );
  const headerData = [
    { title: t("admin.purchases.column.number") },
    { title: t("admin.purchases.column.vendor") },
    { title: t("admin.purchases.column.date") },
    { title: t("admin.purchases.column.total") },
    { title: t("admin.purchases.column.paid") },
    { title: t("admin.purchases.column.status") },
    { title: t("admin.purchases.column.actions"), align: "center" as const },
  ];
  const filteredItems = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return items;
    return items.filter((row) =>
      [
        row.number,
        row.vendor?.name,
        row.vendor?.code,
        row.status,
        row.currencyCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [debouncedSearch, items]);
  const { sortKey, sortDirection, sortedItems, onSortChange } = useTableSort(
    filteredItems,
    purchaseSortAccessors,
    "date",
    "desc",
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await cancelMutation.mutateAsync(deleteTarget.id);
      gooeyToast.success(t("admin.purchases.delete.successTitle"), {
        description: t("admin.purchases.delete.successDescription", {
          number: deleteTarget.number,
        }),
      });
      setDeleteTarget(null);
    } catch (error) {
      gooeyToast.error(t("admin.purchases.delete.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.purchases.delete.errorFallback"),
      });
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
        title={t("admin.purchases.delete.confirmTitle")}
        description={t("admin.purchases.delete.confirmDescription", {
          number: deleteTarget?.number ?? "",
        })}
        confirmLabel={t("admin.purchases.delete.confirm")}
        cancelLabel={t("admin.purchases.delete.cancel")}
        closeLabel={t("admin.purchases.delete.close")}
        workingLabel={t("admin.purchases.delete.working")}
        tone="danger"
        submitting={cancelMutation.isPending}
        onClose={() => {
          if (!cancelMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
      <FormModal
        open={printTarget != null}
        title={`${t("admin.invoice.purchaseTitle")} ${printTarget?.number ?? ""}`}
        description={
          printTarget?.vendor?.name ?? t("admin.purchases.description")
        }
        submitLabel={t("admin.purchases.action.printBill")}
        submittingLabel={t("admin.purchases.action.loadingBill")}
        cancelLabel={t("admin.purchases.delete.cancel")}
        closeLabel={t("admin.purchases.delete.close")}
        submitting={printLoading}
        panelClassName="max-w-3xl"
        contentClassName="block"
        onClose={() => {
          if (!printLoading) setPrintTarget(null);
        }}
        onSubmit={() => window.print()}
      >
        <div className="col-span-2">
          {printTarget && !printLoading ? (
            <AdminPrintableInvoice
              kind="purchase"
              document={printTarget}
              showPrintButton={false}
            />
          ) : (
            <div className="h-80 animate-pulse bg-light-bg dark:bg-dark-bg" />
          )}
        </div>
      </FormModal>
      <AdminCreatePurchaseModal
        accounts={accounts}
        locations={locations}
        products={products}
        vendors={vendors}
        open={createOpen || editTarget != null}
        purchase={editTarget}
        onClose={() => {
          setCreateOpen(false);
          setEditTarget(null);
        }}
      />
      <AdminPurchasePaymentModal
        accounts={accounts}
        open={payTarget != null}
        purchase={payTarget}
        onClose={() => setPayTarget(null)}
      />
      <AdminPurchaseReturnModal
        accounts={accounts}
        open={returnTarget != null}
        purchase={returnTarget}
        onClose={() => setReturnTarget(null)}
      />
      <div className="overflow-hidden border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <Table
          toolbar={
            <TableToolbar>
              <TableToolbar.Row justify="between">
                <TableToolbar.Section>
                  <span className="text-xs font-semibold text-light-muted dark:text-dark-muted">
                    {t("admin.purchases.table.count", {
                      count: filteredItems.length,
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
                    aria-label={t("admin.purchases.action.refresh")}
                    title={t("admin.purchases.action.refresh")}
                  />
                </TableToolbar.Section>
                <button
                  type="button"
                  onClick={() => {
                    setEditTarget(null);
                    setCreateOpen(true);
                  }}
                  className="btn-primary inline-flex min-h-10 items-center gap-2"
                >
                  <Plus className="size-4" />
                  {t("admin.purchases.action.newPurchase")}
                </button>
              </TableToolbar.Row>
              <TableToolbar.Row justify="start" className="gap-2">
                <div className="min-w-0 flex-1 sm:min-w-48">
                  <InputField
                    id="admin-purchases-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={`${t("admin.purchases.column.number")} / ${t("admin.purchases.column.vendor")}`}
                    tone="light"
                    containerClassName="mb-0"
                  />
                </div>
                <div className="w-full shrink-0 sm:w-56">
                  <SelectField
                    options={statusOptions}
                    value={status}
                    onValueChange={(value) =>
                      onStatusChange(value as PurchaseStatus | "all")
                    }
                    tone="light"
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
                  onStatusFilterChange={(value) =>
                    onStatusChange(value as PurchaseStatus | "all")
                  }
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
                title={t("admin.purchases.empty.title")}
                description={t("admin.purchases.empty.description")}
              />
            ) : (
              sortedItems.map((row) => {
                const unpaid =
                  row.status === "posted" && Number(row.paidTotal ?? 0) === 0;
                const hasBalance =
                  row.status !== "cancelled" &&
                  Number(row.total) - Number(row.paidTotal) > 0;
                return (
                  <TableRow
                    key={row.id}
                    className={compactRows ? "[&_td]:py-2" : undefined}
                  >
                    <TableColumn>
                      <span className="font-mono text-xs font-semibold">
                        {row.number}
                      </span>
                    </TableColumn>
                    <TableColumn nowrap={false}>
                      <p className="font-semibold text-light-text dark:text-dark-text">
                        {row.vendor?.name ?? "-"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {row.vendor?.code ?? ""}
                      </p>
                    </TableColumn>
                    <TableColumn>{dateLabel(row.billDate)}</TableColumn>
                    <TableColumn>
                      {money(row.total, row.currencyCode)}
                    </TableColumn>
                    <TableColumn>
                      {money(row.paidTotal, row.currencyCode)}
                    </TableColumn>
                    <TableColumn>
                      <StatusPill
                        label={t(
                          `admin.purchases.status.${row.status}` as never,
                        )}
                        variant={statusVariant(row.status)}
                      />
                    </TableColumn>
                    <TableColumn className="text-center">
                      <TableRowActionsMenu
                        triggerAriaLabel={t("admin.purchases.actions.trigger", {
                          number: row.number,
                        })}
                        categories={[
                          {
                            label: t("admin.purchases.actions.bill"),
                            items: [
                              {
                                id: "view",
                                label: t(
                                  "admin.purchases.action.viewVendorDetails",
                                ),
                                icon: Eye,
                                href: `/admin/purchases/${encodeURIComponent(row.number)}/details`,
                              },
                              {
                                id: "print",
                                label: t("admin.purchases.action.printBill"),
                                icon: Printer,
                                onSelect: () => {
                                  void openPrintPreview(row);
                                },
                              },
                              {
                                id: "pay",
                                label: t("admin.purchases.action.pay"),
                                icon: Banknote,
                                hidden: !hasBalance,
                                onSelect: () => setPayTarget(row),
                              },
                              {
                                id: "return",
                                label: t("admin.purchases.action.return"),
                                icon: PackageMinus,
                                hidden: row.status === "cancelled",
                                onSelect: () => {
                                  void ensurePurchaseLines(row).then((full) =>
                                    setReturnTarget(full),
                                  );
                                },
                              },
                              {
                                id: "edit",
                                label: t("admin.purchases.action.edit"),
                                icon: Pencil,
                                hidden: !unpaid,
                                onSelect: () => {
                                  void ensurePurchaseLines(row).then((full) =>
                                    setEditTarget(full),
                                  );
                                },
                              },
                              {
                                id: "delete",
                                label: t("admin.purchases.action.delete"),
                                icon: Trash2,
                                variant: "danger",
                                hidden: !unpaid,
                                onSelect: () => setDeleteTarget(row),
                              },
                            ],
                          },
                        ]}
                      />
                    </TableColumn>
                  </TableRow>
                );
              })
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

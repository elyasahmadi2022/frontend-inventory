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
import { AdminCreateSaleModal } from "@/components/admin/sales/admin-create-sale-modal";
import { AdminSalePaymentModal } from "@/components/admin/sales/admin-sale-payment-modal";
import { AdminSaleReturnModal } from "@/components/admin/sales/admin-sale-return-modal";
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
import { useCancelAdminSaleMutation } from "@/lib/query/hooks";
import { AdminPrintableInvoice } from "@/components/admin/shared/admin-printable-invoice";
import type { PaginationMeta } from "@/lib/pagination";
import type { AccountRow } from "@/services/accounts.service";
import type { PartnerRow } from "@/services/partners.service";
import type {
  InventoryLocationRow,
  ProductRow,
} from "@/services/products.service";
import type { SaleRow, SaleStatus } from "@/services/sales.service";
import { CurrencyFlagIcon } from "@/components/common/currency-flag-icon";

type Props = {
  accounts: AccountRow[];
  customers: PartnerRow[];
  items: SaleRow[];
  loading?: boolean;
  locations: InventoryLocationRow[];
  pagination?: PaginationMeta | null;
  products: ProductRow[];
  refreshing?: boolean;
  status: SaleStatus | "all";
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRefresh: () => void;
  onStatusChange: (status: SaleStatus | "all") => void;
};

function money(value: string | number | undefined, currency?: string) {
  const parsed = Number(value ?? 0);
  return `${Number.isFinite(parsed) ? parsed.toLocaleString() : "0"} ${currency ?? ""}`.trim();
}

function statusVariant(status: SaleStatus) {
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

const saleSortAccessors = {
  number: (row: SaleRow) => row.number,
  customer: (row: SaleRow) => row.customer?.name ?? "",
  date: (row: SaleRow) => new Date(row.invoiceDate ?? 0).getTime(),
  total: (row: SaleRow) => Number(row.total ?? 0),
  paid: (row: SaleRow) => Number(row.paidTotal ?? 0),
};

export function AdminSalesTable({
  accounts,
  customers,
  items,
  loading = false,
  locations,
  pagination,
  products,
  refreshing = false,
  status,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onStatusChange,
}: Props) {
  const { t } = useI18n();
  const cancelMutation = useCancelAdminSaleMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SaleRow | null>(null);
  const [payTarget, setPayTarget] = useState<SaleRow | null>(null);
  const [returnTarget, setReturnTarget] = useState<SaleRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SaleRow | null>(null);
  const [printTarget, setPrintTarget] = useState<SaleRow | null>(null);
  const [printLoading, setPrintLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [compactRows, setCompactRows] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);

  const ensureSaleLines = async (row: SaleRow) => {
    if ((row.lines?.length ?? 0) > 0) return row;
    const { fetchSaleByNumber } = await import("@/services/sales.service");
    return fetchSaleByNumber(row.number);
  };

  const openPrintPreview = async (row: SaleRow) => {
    setPrintTarget(row);
    setPrintLoading(true);
    try {
      setPrintTarget(await ensureSaleLines(row));
    } catch (error) {
      gooeyToast.error(t("admin.sales.toast.loadFailedTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.sales.toast.loadFailedFallback"),
      });
      setPrintTarget(null);
    } finally {
      setPrintLoading(false);
    }
  };

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t("admin.sales.status.all") },
      { value: "posted", label: t("admin.sales.status.posted") },
      { value: "partially_paid", label: t("admin.sales.status.partiallyPaid") },
      { value: "paid", label: t("admin.sales.status.paid") },
      { value: "cancelled", label: t("admin.sales.status.cancelled") },
    ],
    [t],
  );
  const sortOptions = useMemo(
    () => [
      { value: "number", label: t("admin.sales.column.number") },
      { value: "customer", label: t("admin.sales.column.customer") },
      { value: "date", label: t("admin.sales.column.date") },
      { value: "total", label: t("admin.sales.column.total") },
      { value: "paid", label: t("admin.sales.column.paid") },
    ],
    [t],
  );

  const headerData = [
    { title: t("admin.sales.column.number") },
    { title: t("admin.sales.column.customer") },
    { title: t("admin.sales.column.date") },
    { title: t("admin.sales.column.total") },
    { title: t("admin.sales.column.paid") },
    { title: t("admin.sales.column.status") },
    { title: t("admin.sales.column.actions"), align: "center" as const },
  ];
  const filteredItems = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return items;
    return items.filter((row) =>
      [
        row.number,
        row.customer?.name,
        row.customer?.code,
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
    saleSortAccessors,
    "date",
    "desc",
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await cancelMutation.mutateAsync(deleteTarget.id);
      gooeyToast.success(t("admin.sales.delete.successTitle"), {
        description: t("admin.sales.delete.successDescription", {
          number: deleteTarget.number,
        }),
      });
      setDeleteTarget(null);
    } catch (error) {
      gooeyToast.error(t("admin.sales.delete.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.sales.delete.errorFallback"),
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
        title={t("admin.sales.delete.confirmTitle")}
        description={t("admin.sales.delete.confirmDescription", {
          number: deleteTarget?.number ?? "",
        })}
        confirmLabel={t("admin.sales.delete.confirm")}
        cancelLabel={t("admin.sales.delete.cancel")}
        closeLabel={t("admin.sales.delete.close")}
        workingLabel={t("admin.sales.delete.working")}
        tone="danger"
        submitting={cancelMutation.isPending}
        onClose={() => {
          if (!cancelMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
      <FormModal
        open={printTarget != null}
        title={`${t("admin.invoice.saleTitle")} ${printTarget?.number ?? ""}`}
        description={
          printTarget?.customer?.name ?? t("admin.sales.description")
        }
        submitLabel={t("admin.sales.action.printInvoice")}
        submittingLabel={t("admin.sales.action.loadingInvoice")}
        cancelLabel={t("admin.sales.delete.cancel")}
        closeLabel={t("admin.sales.delete.close")}
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
              kind="sale"
              document={printTarget}
              showPrintButton={false}
            />
          ) : (
            <div className="h-80 animate-pulse bg-light-bg dark:bg-dark-bg" />
          )}
        </div>
      </FormModal>
      <AdminCreateSaleModal
        accounts={accounts}
        customers={customers}
        locations={locations}
        products={products}
        open={createOpen || editTarget != null}
        sale={editTarget}
        onClose={() => {
          setCreateOpen(false);
          setEditTarget(null);
        }}
      />
      <AdminSalePaymentModal
        accounts={accounts}
        open={payTarget != null}
        sale={payTarget}
        onClose={() => setPayTarget(null)}
      />
      <AdminSaleReturnModal
        accounts={accounts}
        open={returnTarget != null}
        sale={returnTarget}
        onClose={() => setReturnTarget(null)}
      />
      <div className="overflow-hidden border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <Table
          toolbar={
            <TableToolbar>
              <TableToolbar.Row justify="between">
                <TableToolbar.Section>
                  <span className="text-xs font-semibold text-light-muted dark:text-dark-muted">
                    {t("admin.sales.table.count", {
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
                    aria-label={t("admin.sales.action.refresh")}
                    title={t("admin.sales.action.refresh")}
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
                  {t("admin.sales.action.newSale")}
                </button>
              </TableToolbar.Row>
              <TableToolbar.Row justify="start" className="gap-2">
                <div className="min-w-0 flex-1 sm:min-w-48">
                  <InputField
                    id="admin-sales-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={`${t("admin.sales.column.number")} / ${t("admin.sales.column.customer")}`}
                    tone="light"
                    containerClassName="mb-0"
                  />
                </div>
                <div className="w-full shrink-0 sm:w-56">
                  <SelectField
                    options={statusOptions}
                    value={status}
                    onValueChange={(value) =>
                      onStatusChange(value as SaleStatus | "all")
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
                    onStatusChange(value as SaleStatus | "all")
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
                title={t("admin.sales.empty.title")}
                description={t("admin.sales.empty.description")}
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
                        {row.customer?.name ?? "-"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {row.customer?.code ?? ""}
                      </p>
                    </TableColumn>
                    <TableColumn>{dateLabel(row.invoiceDate)}</TableColumn>
                    <TableColumn>
                      <span className="inline-flex gap-1">
                        {money(row.total, row.currencyCode)}
                        <span>
                          <CurrencyFlagIcon
                            currency={row.currencyCode}
                            className="w-5"
                          />
                        </span>
                      </span>
                    </TableColumn>
                    <TableColumn>
                      <span className="inline-flex gap-1">
                        {money(row.paidTotal, row.currencyCode)}{" "}
                        <span>
                          <CurrencyFlagIcon
                            currency={row.currencyCode}
                            className="w-5"
                          />
                        </span>
                      </span>
                    </TableColumn>
                    <TableColumn>
                      <StatusPill
                        label={t(`admin.sales.status.${row.status}` as never)}
                        variant={statusVariant(row.status)}
                      />
                    </TableColumn>
                    <TableColumn className="text-center">
                      <TableRowActionsMenu
                        triggerAriaLabel={t("admin.sales.actions.trigger", {
                          number: row.number,
                        })}
                        categories={[
                          {
                            label: t("admin.sales.actions.invoice"),
                            items: [
                              {
                                id: "view",
                                label: t(
                                  "admin.sales.action.viewCustomerDetails",
                                ),
                                icon: Eye,
                                href: `/admin/sales/${encodeURIComponent(row.number)}/details`,
                              },
                              {
                                id: "print",
                                label: t("admin.sales.action.printInvoice"),
                                icon: Printer,
                                onSelect: () => {
                                  void openPrintPreview(row);
                                },
                              },
                              {
                                id: "pay",
                                label: t("admin.sales.action.receivePayment"),
                                icon: Banknote,
                                hidden: !hasBalance,
                                onSelect: () => setPayTarget(row),
                              },
                              {
                                id: "return",
                                label: t("admin.sales.action.return"),
                                icon: PackageMinus,
                                hidden: row.status === "cancelled",
                                onSelect: () => {
                                  void ensureSaleLines(row).then((full) =>
                                    setReturnTarget(full),
                                  );
                                },
                              },
                              {
                                id: "edit",
                                label: t("admin.sales.action.edit"),
                                icon: Pencil,
                                hidden: !unpaid,
                                onSelect: () => {
                                  void ensureSaleLines(row).then((full) =>
                                    setEditTarget(full),
                                  );
                                },
                              },
                              {
                                id: "delete",
                                label: t("admin.sales.action.delete"),
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

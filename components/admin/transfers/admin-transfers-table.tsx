"use client";

import clsx from "clsx";
import { Eye, Plus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminCreateTransferModal } from "@/components/admin/transfers/admin-create-transfer-modal";
import { formatAdminNumber } from "@/components/admin/shared/admin-money-display";
import DataTableEmptyState from "@/components/common/data-table-empty-state";
import { InputField } from "@/components/common/input-field";
import { CurrencyFlagIcon } from "@/components/common/currency-flag-icon";
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
import { TableToolbarIcon, tableToolbarIconClass } from "@/components/common/table-toolbar-icons";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTableSort } from "@/hooks/use-table-sort";
import { useI18n } from "@/lib/i18n";
import type { PaginationMeta } from "@/lib/pagination";
import type { AccountRow } from "@/services/accounts.service";
import type { TransferRow, TransferStatus } from "@/services/transfers.service";

type Props = {
  accounts: AccountRow[];
  items: TransferRow[];
  loading?: boolean;
  pagination?: PaginationMeta | null;
  refreshing?: boolean;
  status: TransferStatus | "all";
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRefresh: () => void;
  onStatusChange: (status: TransferStatus | "all") => void;
  showCreate?: boolean;
};

function money(value: string | number | undefined, currency: string | undefined, language: string) {
  return `${formatAdminNumber(value, language)} ${currency ?? ""}`.trim();
}

function dateLabel(value: string | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
}

const transferSortAccessors = {
  number: (row: TransferRow) => row.number,
  date: (row: TransferRow) => new Date(row.transferDate ?? 0).getTime(),
  from: (row: TransferRow) => row.fromAccount?.name ?? "",
  to: (row: TransferRow) => row.toAccount?.name ?? "",
  amount: (row: TransferRow) => Number(row.amount ?? 0),
};

export function AdminTransfersTable({
  accounts,
  items,
  loading = false,
  pagination,
  refreshing = false,
  status,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onStatusChange,
  showCreate = true,
}: Props) {
  const { language, t } = useI18n();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [compactRows, setCompactRows] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);
  const statusOptions = useMemo(
    () => [
      { value: "all", label: t("admin.transfers.status.all") },
      { value: "posted", label: t("admin.transfers.status.posted") },
      { value: "draft", label: t("admin.transfers.status.draft") },
      { value: "cancelled", label: t("admin.transfers.status.cancelled") },
    ],
    [t],
  );
  const sortOptions = useMemo(
    () => [
      { value: "number", label: t("admin.transfers.column.number") },
      { value: "date", label: t("admin.transfers.column.date") },
      { value: "from", label: t("admin.transfers.column.from") },
      { value: "to", label: t("admin.transfers.column.to") },
      { value: "amount", label: t("admin.transfers.column.amount") },
    ],
    [t],
  );
  const headerData = [
    { title: t("admin.transfers.column.number") },
    { title: t("admin.transfers.column.date") },
    { title: t("admin.transfers.column.from") },
    { title: t("admin.transfers.column.to") },
    { title: t("admin.transfers.column.amount") },
    { title: t("admin.transfers.column.status") },
    { title: t("admin.transfers.column.actions"), align: "center" as const },
  ];
  const filteredItems = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return items;
    return items.filter((row) =>
      [
        row.number,
        row.fromAccount?.name,
        row.toAccount?.name,
        row.currencyCode,
        row.status,
        row.reference,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [debouncedSearch, items]);
  const { sortKey, sortDirection, sortedItems, onSortChange } = useTableSort(
    filteredItems,
    transferSortAccessors,
    "date",
    "desc",
  );

  if (loading) {
    return <div className="border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface"><div className="h-40 animate-pulse bg-light-border dark:bg-dark-border" /></div>;
  }

  return (
    <>
      <AdminCreateTransferModal accounts={accounts} open={createOpen} onClose={() => setCreateOpen(false)} />
      <div className="overflow-hidden border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <Table toolbar={
          <TableToolbar>
            <TableToolbar.Row justify="between">
              <TableToolbar.Section>
                <span className="text-xs font-semibold text-light-muted dark:text-dark-muted">{t("admin.transfers.table.count", { count: formatAdminNumber(filteredItems.length, language) })}</span>
                <TableToolbar.IconButton iconOnly icon={<TableToolbarIcon icon={RefreshCw} className={clsx(tableToolbarIconClass, refreshing && "animate-spin")} />} onClick={onRefresh} disabled={refreshing} aria-label={t("admin.transfers.action.refresh")} title={t("admin.transfers.action.refresh")} />
              </TableToolbar.Section>
              {showCreate ? <button type="button" className="btn-primary inline-flex min-h-10 items-center gap-2" onClick={() => setCreateOpen(true)}><Plus className="size-4" />{t("admin.transfers.action.newTransfer")}</button> : null}
            </TableToolbar.Row>
            <TableToolbar.Row justify="start" className="gap-2">
              <div className="min-w-0 flex-1 sm:min-w-48">
                <InputField
                  id="admin-transfers-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={`${t("admin.transfers.column.number")} / ${t("admin.transfers.column.from")}`}
                  tone="light"
                  containerClassName="mb-0"
                />
              </div>
              <div className="w-full shrink-0 sm:w-52"><SelectField options={statusOptions} value={status} onValueChange={(value) => onStatusChange(value as TransferStatus | "all")} tone="light" clearable={false} /></div>
              <TableToolDropdowns
                labels={{
                  filter: t("admin.users.tools.filter"),
                  sort: t("admin.users.tools.sort"),
                  columns: t("admin.users.tools.columns"),
                  hide: t("admin.users.tools.display"),
                }}
                statusOptions={statusOptions}
                statusFilter={status}
                onStatusFilterChange={(value) => onStatusChange(value as TransferStatus | "all")}
                sortOptions={sortOptions}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSortChange={onSortChange}
                compactRows={compactRows}
                onToggleCompactRows={() => setCompactRows((value) => !value)}
              />
            </TableToolbar.Row>
          </TableToolbar>
        }>
          <TableHeader headerData={headerData} />
          <TableBody>
            {sortedItems.length === 0 ? <DataTableEmptyState colSpan={headerData.length} title={t("admin.transfers.empty.title")} description={t("admin.transfers.empty.description")} /> : sortedItems.map((row) => (
              <TableRow key={row.id} className={compactRows ? "[&_td]:py-2" : undefined}>
                <TableColumn><span className="font-mono text-xs font-semibold">{row.number}</span></TableColumn>
                <TableColumn>{dateLabel(row.transferDate)}</TableColumn>
                <TableColumn nowrap={false}>{row.fromAccount?.name ?? "-"}</TableColumn>
                <TableColumn nowrap={false}>{row.toAccount?.name ?? "-"}</TableColumn>
                <TableColumn>
                  <div className="flex flex-wrap items-center gap-1.5 tabular-nums">
                    <CurrencyFlagIcon currency={row.currencyCode} className="h-4 w-6" />
                    <span>{money(row.amount, row.currencyCode, language)}</span>
                    {row.destinationCurrencyCode && row.destinationCurrencyCode !== row.currencyCode ? <>
                      <span aria-hidden="true">→</span>
                      <CurrencyFlagIcon currency={row.destinationCurrencyCode} className="h-4 w-6" />
                      <span>{money(row.destinationAmount ?? 0, row.destinationCurrencyCode, language)}</span>
                    </> : null}
                  </div>
                </TableColumn>
                <TableColumn><StatusPill label={t(`admin.transfers.status.${row.status}` as never)} variant={row.status === "posted" ? "success" : row.status === "cancelled" ? "error" : "neutral"} /></TableColumn>
                <TableColumn className="text-center"><TableRowActionsMenu triggerAriaLabel={t("admin.transfers.actions.trigger", { number: row.number })} categories={[{ label: t("admin.transfers.actions.transfer"), items: [{ id: "view", label: t("admin.transfers.action.viewTransfer"), icon: Eye, disabled: true }] }]} /></TableColumn>
              </TableRow>
            ))}
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

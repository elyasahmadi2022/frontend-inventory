"use client";

import clsx from "clsx";
import { Edit, Eye, Plus, Power, PowerOff, RefreshCw, Trash2 } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminAccountModal } from "@/components/admin/accounts/admin-account-modal";
import { ConfirmModal } from "@/components/common/confirm-modal";
import DataTableEmptyState from "@/components/common/data-table-empty-state";
import { InputField } from "@/components/common/input-field";
import Pagination from "@/components/common/pagination";
import { SelectField } from "@/components/common/select-field";
import { CurrencyFlagIcon } from "@/components/common/currency-flag-icon";
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
import { formatAdminNumber } from "@/components/admin/shared/admin-money-display";
import type { PaginationMeta } from "@/lib/pagination";
import {
  useDeleteAdminAccountMutation,
  useUpdateAdminAccountMutation,
} from "@/lib/query/hooks";
import { appRoutes } from "@/routes/app-routes";
import type { AccountCategory, AccountRow, AccountType, CurrencyCode } from "@/services/accounts.service";

type AccountCategoryFilter = AccountCategory | "all";

const accountTypes: AccountType[] = [
  "cash",
  "bank",
  "sarafi",
  "daskhil",
  "accounts_receivable",
  "accounts_payable",
  "inventory",
  "cost_of_goods_sold",
  "sales_revenue",
  "purchase",
  "expense",
  "equity",
  "liability",
  "exchange_gain",
  "exchange_loss",
  "other",
];

const accountTypesByCategory: Record<AccountCategory, AccountType[]> = {
  asset: ["cash", "bank", "sarafi", "daskhil", "accounts_receivable", "inventory", "other"],
  liability: ["accounts_payable", "liability"],
  equity: ["equity"],
  revenue: ["sales_revenue", "exchange_gain", "other"],
  expense: ["cost_of_goods_sold", "purchase", "expense", "exchange_loss"],
};

type Props = {
  items: AccountRow[];
  loading?: boolean;
  pagination?: PaginationMeta | null;
  refreshing?: boolean;
  category: AccountCategoryFilter;
  type: AccountType | "all";
  currency: CurrencyCode | "all";
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRefresh: () => void;
  onTypeChange: (type: AccountType | "all") => void;
  onCurrencyChange: (currency: CurrencyCode | "all") => void;
};

function balanceValue(row: AccountRow, language: string) {
  const balance = row.balances?.[0]?.balance ?? 0;
  return formatAdminNumber(balance, language);
}

const accountSortAccessors = {
  balancePriority: (row: AccountRow) =>
    row.balances?.some((balance) => Number(balance.balance ?? 0) !== 0) ? 0 : 1,
  code: (row: AccountRow) => row.code,
  name: (row: AccountRow) => row.name,
  category: (row: AccountRow) => row.category,
  type: (row: AccountRow) => row.type,
  balance: (row: AccountRow) => Number(row.balances?.[0]?.balance ?? 0),
};

export function AdminAccountsTable({
  items,
  loading = false,
  pagination,
  refreshing = false,
  category,
  type,
  currency,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onTypeChange,
  onCurrencyChange,
}: Props) {
  const { language, t } = useI18n();
  const pathname = usePathname();
  const accountDetailsHref = (code: string | number) =>
    pathname.startsWith("/dashboard")
      ? `/dashboard/accounts/${code}`
      : appRoutes.adminAccountDetails(code);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AccountRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccountRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [compactRows, setCompactRows] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);
  const updateMutation = useUpdateAdminAccountMutation();
  const deleteMutation = useDeleteAdminAccountMutation();

  const typeOptions = useMemo(
    () => [
      { value: "all", label: t("admin.accounts.type.all") },
      ...(category === "all" ? accountTypes : accountTypesByCategory[category]).map((value) => ({
        value,
        label: t(`admin.accounts.type.${value}` as never),
      })),
    ],
    [category, t],
  );
  const currencyOptions = useMemo(
    () => [
      { value: "all", label: `${t("admin.accounts.column.currency")}: ${t("admin.accounts.status.all")}` },
      { value: "AFN", label: "Afghani (AFN)", icon: <CurrencyFlagIcon currency="AFN" className="h-4 w-6" /> },
      { value: "USD", label: "US Dollar (USD)", icon: <CurrencyFlagIcon currency="USD" className="h-4 w-6" /> },
      { value: "PKR", label: "Pakistani Rupee (PKR)", icon: <CurrencyFlagIcon currency="PKR" className="h-4 w-6" /> },
    ],
    [t],
  );
  const sortOptions = useMemo(
    () => [
      { value: "balancePriority", label: "Non-zero balance first" },
      { value: "code", label: t("admin.accounts.column.code") },
      { value: "name", label: t("admin.accounts.column.name") },
      { value: "category", label: t("admin.accounts.column.category") },
      { value: "type", label: t("admin.accounts.column.type") },
      { value: "balance", label: t("admin.accounts.column.balance") },
    ],
    [t],
  );
  const headerData = [
    { title: t("admin.accounts.column.code") },
    { title: t("admin.accounts.column.name") },
    { title: t("admin.accounts.column.category") },
    { title: t("admin.accounts.column.type") },
    { title: t("admin.accounts.column.balance") },
    { title: t("admin.accounts.column.currency") },
    { title: t("admin.accounts.column.status") },
    { title: t("admin.accounts.column.actions"), align: "center" as const },
  ];
  const filteredItems = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return items;
    return items.filter((row) =>
      [row.code, row.name, row.type, row.category, row.currencyCode, row.parent?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [debouncedSearch, items]);
  const { sortKey, sortDirection, sortedItems, onSortChange } = useTableSort(
    filteredItems,
    accountSortAccessors,
    "balancePriority",
  );

  const toggleStatus = async (row: AccountRow) => {
    setBusyId(row.id);
    try {
      const saved = await updateMutation.mutateAsync({
        id: row.id,
        input: { isActive: !row.isActive },
      });
      gooeyToast.success(
        saved.isActive
          ? t("admin.accounts.status.activatedTitle")
          : t("admin.accounts.status.deactivatedTitle"),
        { description: t("admin.accounts.status.savedDescription", { name: saved.name }) },
      );
    } catch (error) {
      gooeyToast.error(t("admin.accounts.status.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.accounts.status.errorFallback"),
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      gooeyToast.success(t("admin.accounts.delete.successTitle"), {
        description: t("admin.accounts.delete.successDescription", {
          name: deleteTarget.name,
        }),
      });
      setDeleteTarget(null);
    } catch (error) {
      gooeyToast.error(t("admin.accounts.delete.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.accounts.delete.errorFallback"),
      });
    } finally {
      setBusyId(null);
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
        title={t("admin.accounts.delete.confirmTitle")}
        description={t("admin.accounts.delete.confirmDescription", {
          name: deleteTarget?.name ?? "",
        })}
        confirmLabel={t("admin.accounts.delete.confirm")}
        cancelLabel={t("admin.accounts.delete.cancel")}
        closeLabel={t("admin.accounts.delete.close")}
        workingLabel={t("admin.accounts.delete.working")}
        tone="danger"
        submitting={deleteMutation.isPending}
        onClose={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
      <AdminAccountModal accounts={items} account={editing} open={open} onClose={() => { setOpen(false); setEditing(null); }} />
      <div className="overflow-hidden border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <Table
          toolbar={
            <TableToolbar>
              <TableToolbar.Row justify="between">
                <TableToolbar.Section>
                  <span className="text-xs font-semibold text-light-muted dark:text-dark-muted">{t("admin.accounts.table.count", { count: formatAdminNumber(filteredItems.length, language) })}</span>
                  <TableToolbar.IconButton iconOnly icon={<TableToolbarIcon icon={RefreshCw} className={clsx(tableToolbarIconClass, refreshing && "animate-spin")} />} onClick={onRefresh} disabled={refreshing} aria-label={t("admin.accounts.action.refresh")} title={t("admin.accounts.action.refresh")} />
                </TableToolbar.Section>
                <TableToolbar.Section>
                  <button type="button" className="btn-primary inline-flex min-h-10 items-center gap-2" onClick={() => setOpen(true)}>
                    <Plus className="size-4" />
                    {t("admin.accounts.action.newAccount")}
                  </button>
                </TableToolbar.Section>
              </TableToolbar.Row>
              <TableToolbar.Row justify="start" className="gap-2">
                <div className="min-w-0 flex-1 sm:min-w-48">
                  <InputField
                    id="admin-accounts-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={`${t("admin.accounts.column.code")} / ${t("admin.accounts.column.name")}`}
                    tone="light"
                    containerClassName="mb-0"
                  />
                </div>
                <div className="w-full shrink-0 sm:w-52"><SelectField options={typeOptions} value={type} onValueChange={(value) => onTypeChange(value as AccountType | "all")} tone="light" clearable={false} /></div>
                <div className="w-full shrink-0 sm:w-52"><SelectField options={currencyOptions} value={currency} onValueChange={(value) => onCurrencyChange(value as CurrencyCode | "all")} tone="light" clearable={false} /></div>
                <TableToolDropdowns
                  labels={{
                    filter: t("admin.users.tools.filter"),
                    sort: t("admin.users.tools.sort"),
                    columns: t("admin.users.tools.columns"),
                    hide: t("admin.users.tools.display"),
                  }}
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
              <DataTableEmptyState colSpan={headerData.length} title={t("admin.accounts.empty.title")} description={t("admin.accounts.empty.description")} />
            ) : (
              sortedItems.map((row) => (
                <TableRow key={row.id} className={compactRows ? "[&_td]:py-2" : undefined}>
                  <TableColumn><span className="font-mono text-xs font-semibold">{row.code}</span></TableColumn>
                  <TableColumn nowrap={false}><p className="font-semibold text-light-text dark:text-dark-text">{row.name}</p><p className="mt-0.5 text-xs text-muted">{row.parent?.name ?? "-"}</p></TableColumn>
                  <TableColumn>{t(`admin.accounts.category.${row.category}` as never)}</TableColumn>
                  <TableColumn>{t(`admin.accounts.type.${row.type}` as never)}</TableColumn>
                  <TableColumn>{balanceValue(row, language)}</TableColumn>
                  <TableColumn nowrap={false}>{row.currencyCode ?? "-"}</TableColumn>
                  <TableColumn><StatusPill label={row.isActive ? t("admin.accounts.status.active") : t("admin.accounts.status.inactive")} variant={row.isActive ? "success" : "neutral"} /></TableColumn>
                  <TableColumn className="text-center">
                    <TableRowActionsMenu
                      triggerAriaLabel={t("admin.accounts.actions.trigger", { name: row.name })}
                      categories={[{
                        label: t("admin.accounts.actions.account"), items: [
                          { id: "details", label: t("admin.accounts.action.viewDetails"), icon: Eye, href: accountDetailsHref(row.code) },
                          { id: "edit", label: t("admin.accounts.action.editAccount"), icon: Edit, onSelect: () => { setEditing(row); setOpen(true); } },
                          { id: "toggle", label: row.isActive ? t("admin.accounts.action.deactivate") : t("admin.accounts.action.activate"), icon: row.isActive ? PowerOff : Power, variant: row.isActive ? "warning" : "success", disabled: updateMutation.isPending && busyId === row.id, onSelect: () => void toggleStatus(row) },
                          { id: "delete", label: t("admin.accounts.action.deleteAccount"), icon: Trash2, variant: "danger", disabled: deleteMutation.isPending && busyId === row.id, onSelect: () => setDeleteTarget(row) },
                        ]
                      }]}
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

"use client";

import clsx from "clsx";
import { Edit, Eye, Landmark, Plus, Power, PowerOff, RefreshCw, Trash2 } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminPartnerLedgerModal } from "@/components/admin/partners/admin-partner-ledger-modal";
import { AdminPartnerModal } from "@/components/admin/partners/admin-partner-modal";
import { ConfirmModal } from "@/components/common/confirm-modal";
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
import { formatAdminNumber } from "@/components/admin/shared/admin-money-display";
import type { PaginationMeta } from "@/lib/pagination";
import {
  useDeleteAdminPartnerMutation,
  useUpdateAdminPartnerMutation,
} from "@/lib/query/hooks";
import type { AccountRow } from "@/services/accounts.service";
import type { PartnerRow } from "@/services/partners.service";

type PartnerStatus = "all" | "active" | "inactive";

const partnerSortAccessors = {
  code: (row: PartnerRow) => row.code,
  name: (row: PartnerRow) => row.name,
  type: (row: PartnerRow) => row.type,
  ledgers: (row: PartnerRow) => row.ledgerAccounts?.length ?? 0,
};

type Props = {
  accounts: AccountRow[];
  items: PartnerRow[];
  loading?: boolean;
  pagination?: PaginationMeta | null;
  refreshing?: boolean;
  status: PartnerStatus;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRefresh: () => void;
  onStatusChange: (status: PartnerStatus) => void;
};

export function AdminPartnersTable({
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
}: Props) {
  const { language, t } = useI18n();
  const pathname = usePathname();
  const detailsBasePath = pathname.startsWith("/dashboard")
    ? "/dashboard/partners"
    : "/admin/partners";
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerRow | null>(null);
  const [ledgerTarget, setLedgerTarget] = useState<PartnerRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PartnerRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [compactRows, setCompactRows] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);
  const updateMutation = useUpdateAdminPartnerMutation();
  const deleteMutation = useDeleteAdminPartnerMutation();

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t("admin.partners.status.all") },
      { value: "active", label: t("admin.partners.status.active") },
      { value: "inactive", label: t("admin.partners.status.inactive") },
    ],
    [t],
  );
  const sortOptions = useMemo(
    () => [
      { value: "code", label: t("admin.partners.column.code") },
      { value: "name", label: t("admin.partners.column.name") },
      { value: "type", label: t("admin.partners.column.type") },
      { value: "ledgers", label: t("admin.partners.column.ledgers") },
    ],
    [t],
  );
  const headerData = [
    { title: t("admin.partners.column.code") },
    { title: t("admin.partners.column.name") },
    { title: t("admin.partners.column.type") },
    { title: t("admin.partners.column.ledgers") },
    { title: t("admin.partners.column.status") },
    { title: t("admin.partners.column.actions"), align: "center" as const },
  ];
  const filteredItems = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return items;
    return items.filter((row) =>
      [row.code, row.name, row.type, row.phone, row.address]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [debouncedSearch, items]);
  const { sortKey, sortDirection, sortedItems, onSortChange } = useTableSort(
    filteredItems,
    partnerSortAccessors,
    "name",
  );

  const toggleStatus = async (row: PartnerRow) => {
    setBusyId(row.id);
    try {
      const saved = await updateMutation.mutateAsync({
        id: row.id,
        input: { isActive: !row.isActive },
      });
      gooeyToast.success(
        saved.isActive
          ? t("admin.partners.status.activatedTitle")
          : t("admin.partners.status.deactivatedTitle"),
        {
          description: t("admin.partners.status.savedDescription", {
            name: saved.name,
          }),
        },
      );
    } catch (error) {
      gooeyToast.error(t("admin.partners.status.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.partners.status.errorFallback"),
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      const saved = await deleteMutation.mutateAsync(deleteTarget.id);
      gooeyToast.success(t("admin.partners.delete.successTitle"), {
        description: t("admin.partners.delete.successDescription", {
          name: saved.name,
        }),
      });
      setDeleteTarget(null);
    } catch (error) {
      gooeyToast.error(t("admin.partners.delete.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.partners.delete.errorFallback"),
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
        title={t("admin.partners.delete.confirmTitle")}
        description={t("admin.partners.delete.confirmDescription", {
          name: deleteTarget?.name ?? "",
        })}
        confirmLabel={t("admin.partners.delete.confirm")}
        cancelLabel={t("admin.partners.delete.cancel")}
        closeLabel={t("admin.partners.delete.close")}
        workingLabel={t("admin.partners.delete.working")}
        tone="danger"
        submitting={deleteMutation.isPending}
        onClose={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
      <AdminPartnerModal open={partnerOpen} partner={editing} onClose={() => { setPartnerOpen(false); setEditing(null); }} />
      <AdminPartnerLedgerModal accounts={accounts} open={ledgerOpen} partner={ledgerTarget} onClose={() => { setLedgerOpen(false); setLedgerTarget(null); }} />
      <div className="overflow-hidden border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <Table
          toolbar={
            <TableToolbar>
              <TableToolbar.Row justify="between">
                <TableToolbar.Section>
                  <span className="text-xs font-semibold text-light-muted dark:text-dark-muted">
                    {t("admin.partners.table.count", { count: formatAdminNumber(filteredItems.length, language) })}
                  </span>
                  <TableToolbar.IconButton iconOnly icon={<TableToolbarIcon icon={RefreshCw} className={clsx(tableToolbarIconClass, refreshing && "animate-spin")} />} onClick={onRefresh} disabled={refreshing} aria-label={t("admin.partners.action.refresh")} title={t("admin.partners.action.refresh")} />
                </TableToolbar.Section>
                <button type="button" className="btn-primary inline-flex min-h-10 items-center gap-2" onClick={() => setPartnerOpen(true)}>
                  <Plus className="size-4" />
                  {t("admin.partners.action.newPartner")}
                </button>
              </TableToolbar.Row>
              <TableToolbar.Row justify="start" className="gap-2">
                <div className="min-w-0 flex-1 sm:min-w-48">
                  <InputField
                    id="admin-partners-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={`${t("admin.partners.column.code")} / ${t("admin.partners.column.name")}`}
                    tone="light"
                    containerClassName="mb-0"
                  />
                </div>
                <div className="w-full shrink-0 sm:w-44">
                  <SelectField options={statusOptions} value={status} onValueChange={(value) => onStatusChange(value as PartnerStatus)} tone="light" clearable={false} />
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
                  onStatusFilterChange={(value) => onStatusChange(value as PartnerStatus)}
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
              <DataTableEmptyState colSpan={headerData.length} title={t("admin.partners.empty.title")} description={t("admin.partners.empty.description")} />
            ) : (
              sortedItems.map((row) => (
                <TableRow key={row.id} className={compactRows ? "[&_td]:py-2" : undefined}>
                  <TableColumn><span className="font-mono text-xs font-semibold">{row.code}</span></TableColumn>
                  <TableColumn nowrap={false}>
                    <p className="font-semibold text-light-text dark:text-dark-text">{row.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{row.phone || row.address || "-"}</p>
                  </TableColumn>
                  <TableColumn>{t(`admin.partners.type.${row.type}` as never)}</TableColumn>
                  <TableColumn>{formatAdminNumber(row.ledgerAccounts?.length ?? 0, language)}</TableColumn>
                  <TableColumn><StatusPill label={row.isActive ? t("admin.partners.status.active") : t("admin.partners.status.inactive")} variant={row.isActive ? "success" : "neutral"} /></TableColumn>
                  <TableColumn className="text-center">
                    <TableRowActionsMenu
                      triggerAriaLabel={t("admin.partners.actions.trigger", { name: row.name })}
                      categories={[
                        {
                          label: t("admin.partners.actions.partner"),
                          items: [
                            { id: "view", label: t("admin.accounts.action.viewDetails"), icon: Eye, href: `${detailsBasePath}/${encodeURIComponent(row.id)}` },
                            { id: "edit", label: t("admin.partners.action.editPartner"), icon: Edit, onSelect: () => { setEditing(row); setPartnerOpen(true); } },
                            { id: "ledger", label: t("admin.partners.action.addLedger"), icon: Landmark, onSelect: () => { setLedgerTarget(row); setLedgerOpen(true); } },
                            { id: "toggle", label: row.isActive ? t("admin.partners.action.deactivate") : t("admin.partners.action.activate"), icon: row.isActive ? PowerOff : Power, variant: row.isActive ? "warning" : "success", disabled: updateMutation.isPending && busyId === row.id, onSelect: () => void toggleStatus(row) },
                            { id: "delete", label: t("admin.partners.action.deletePartner"), icon: Trash2, variant: "danger", disabled: deleteMutation.isPending && busyId === row.id, onSelect: () => setDeleteTarget(row) },
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

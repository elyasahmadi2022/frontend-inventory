"use client";

import clsx from "clsx";
import { gooeyToast } from "goey-toast";
import { AdminCreateUserModal } from "@/components/admin/users/admin-create-user-modal";
import AdminUserRowActionsMenu from "@/components/admin/users/admin-user-row-actions-menu";
import { Plus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
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
import TableToolDropdowns from "@/components/common/table-tool-dropdowns";
import TableToolbar from "@/components/common/table-tool-bar";
import { TableToolbarIcon, tableToolbarIconClass } from "@/components/common/table-toolbar-icons";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useFilteredPage } from "@/hooks/use-filtered-page";
import { useTableColumns } from "@/hooks/use-table-columns";
import { useTableSort } from "@/hooks/use-table-sort";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import { paginateItems } from "@/lib/pagination";
import {
  useDeleteAdminUserMutation,
  useUpdateAdminUserStatusMutation,
} from "@/lib/query/hooks";
import type { AdminUserRow } from "@/services/admin-users.service";

type SortKey = "id" | "name" | "email" | "role" | "created";
type RoleFilter = "all" | "admin" | "manager" | "staff";
type AccountStatusFilter = "all" | "active" | "disabled";

const ROLE_OPTIONS: { value: RoleFilter; labelKey: TranslationKey }[] = [
  { value: "all", labelKey: "admin.users.role.all" },
  { value: "admin", labelKey: "admin.users.role.admin" },
  { value: "manager", labelKey: "admin.users.role.manager" },
  { value: "staff", labelKey: "admin.users.role.staff" },
];

const STATUS_OPTIONS: { value: AccountStatusFilter; labelKey: TranslationKey }[] = [
  { value: "all", labelKey: "admin.users.status.all" },
  { value: "active", labelKey: "admin.users.status.active" },
  { value: "disabled", labelKey: "admin.users.status.disabled" },
];

const SORT_OPTIONS: { value: SortKey; labelKey: TranslationKey }[] = [
  { value: "created", labelKey: "admin.users.sort.created" },
  { value: "name", labelKey: "admin.users.column.user" },
  { value: "email", labelKey: "admin.users.column.email" },
  { value: "role", labelKey: "admin.users.column.role" },
  { value: "id", labelKey: "admin.users.column.id" },
];

const columnDefs = [
  { id: "id", title: "ID", defaultVisible: true },
  { id: "user", title: "User", defaultVisible: true },
  { id: "role", title: "Role", defaultVisible: true },
  { id: "email", title: "Email", defaultVisible: true },
  { id: "joined", title: "Joined", defaultVisible: true },
  { id: "status", title: "Account", defaultVisible: true },
  { id: "actions", title: "Operations", defaultVisible: true, align: "center" as const },
];

const sortAccessors: Record<SortKey, (row: AdminUserRow) => string | number> = {
  id: (row) => row.id,
  name: (row) => row.name,
  email: (row) => row.email,
  role: (row) => row.role,
  created: (row) => new Date(row.createdAt ?? 0).getTime(),
};

function formatJoinedDate(value: string | undefined, language: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(language === "en" ? "en-US" : language, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function accountStatusVariant(
  row: AdminUserRow,
): "success" | "warning" | "error" | "neutral" {
  if (row.isDeleted) return "error";
  return "success";
}

function matchesSearch(row: AdminUserRow, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [
    row.name,
    row.email,
    row.role,
    String(row.id),
    row.owner?.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

export function AdminUsersTableSkeleton() {
  return (
    <div className="overflow-hidden border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface">
      <Table
        toolbar={
          <TableToolbar>
            <TableToolbar.Row>
              <div className="h-8 w-48 animate-pulse bg-light-border dark:bg-dark-border" />
            </TableToolbar.Row>
          </TableToolbar>
        }
      >
        <TableHeader headerData={[{ title: "ID" }, { title: "User" }, { title: "Operations", align: "center" }]} />
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={`admin-users-skeleton-${index}`} disableHover>
              <TableColumn>
                <div className="h-4 w-12 animate-pulse bg-light-border dark:bg-dark-border" />
              </TableColumn>
              <TableColumn>
                <div className="h-4 w-32 animate-pulse bg-light-border dark:bg-dark-border" />
              </TableColumn>
              <TableColumn>
                <div className="mx-auto h-4 w-8 animate-pulse bg-light-border dark:bg-dark-border" />
              </TableColumn>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

type AdminUsersTableProps = {
  items: AdminUserRow[];
  loading?: boolean;
  refreshing?: boolean;
  busyUserId?: string | null;
  onRefresh: () => void;
  onAskForVerify?: (row: AdminUserRow) => void;
  pageSize?: number;
};

export function AdminUsersTable({
  items,
  loading = false,
  refreshing = false,
  busyUserId = null,
  onRefresh,
  onAskForVerify,
  pageSize = 10,
}: AdminUsersTableProps) {
  const { language, t } = useI18n();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<AccountStatusFilter>("all");
  const [compactRows, setCompactRows] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);
  const [operationUserId, setOperationUserId] = useState<string | null>(null);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const updateStatusMutation = useUpdateAdminUserStatusMutation();
  const deleteUserMutation = useDeleteAdminUserMutation();
  const operating = updateStatusMutation.isPending || deleteUserMutation.isPending;

  const translatedColumnDefs = useMemo(
    () =>
      columnDefs.map((column) => ({
        ...column,
        title:
          column.id === "id"
            ? t("admin.users.column.id")
            : column.id === "user"
              ? t("admin.users.column.user")
              : column.id === "role"
                ? t("admin.users.column.role")
                : column.id === "email"
                  ? t("admin.users.column.email")
                  : column.id === "joined"
                    ? t("admin.users.column.joined")
                    : column.id === "status"
                      ? t("admin.users.column.status")
                      : t("admin.users.column.actions"),
      })),
    [t],
  );

  const roleOptions = useMemo(
    () =>
      ROLE_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t],
  );
  const statusOptions = useMemo(
    () =>
      STATUS_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t],
  );
  const sortOptions = useMemo(
    () =>
      SORT_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t],
  );

  const {
    headerData,
    toolColumns,
    hiddenColumnsList,
    isColumnVisible,
    toggleColumn,
    resetColumns,
  } = useTableColumns(translatedColumnDefs);

  const filteredItems = useMemo(() => {
    return items.filter((row) => {
      if (statusFilter === "active" && row.isDeleted) {
        return false;
      }
      if (statusFilter === "disabled" && !row.isDeleted) {
        return false;
      }
      if (roleFilter !== "all" && row.role.toLowerCase() !== roleFilter) {
        return false;
      }
      return matchesSearch(row, debouncedSearch);
    });
  }, [debouncedSearch, items, roleFilter, statusFilter]);

  const { sortKey, sortDirection, sortedItems, onSortChange, resetSort } =
    useTableSort(filteredItems, sortAccessors, "created", "desc");

  const pageSignature = [
    debouncedSearch,
    roleFilter,
    sortKey,
    sortDirection,
    items.length,
    currentPageSize,
  ].join("|");
  const [page, setPage] = useFilteredPage(pageSignature);

  const { pageItems, meta } = useMemo(
    () => paginateItems(sortedItems, page, currentPageSize),
    [sortedItems, page, currentPageSize],
  );

  const hasActiveFilters =
    searchInput.trim().length > 0 ||
    roleFilter !== "all" ||
    statusFilter !== "all";

  const clearFilters = () => {
    setSearchInput("");
    setRoleFilter("all");
    setStatusFilter("all");
    resetSort();
  };

  const handleToggleStatus = async (row: AdminUserRow) => {
    const nextStatus = row.isDeleted ? "active" : "disabled";
    setOperationUserId(row.id);
    try {
      await updateStatusMutation.mutateAsync({
        id: row.id,
        status: nextStatus,
      });
      gooeyToast.success(
        row.isDeleted
          ? t("admin.users.statusToggle.activatedTitle")
          : t("admin.users.statusToggle.deactivatedTitle"),
        {
          description: t("admin.users.statusToggle.successDescription", {
            name: row.name,
          }),
        },
      );
    } catch (error) {
      gooeyToast.error(t("admin.users.statusToggle.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.users.statusToggle.errorFallback"),
      });
    } finally {
      setOperationUserId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setOperationUserId(deleteTarget.id);
    try {
      await deleteUserMutation.mutateAsync(deleteTarget.id);
      gooeyToast.success(t("admin.users.delete.successTitle"), {
        description: t("admin.users.delete.successDescription", {
          name: deleteTarget.name,
        }),
      });
      setDeleteTarget(null);
    } catch (error) {
      gooeyToast.error(t("admin.users.delete.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.users.delete.errorFallback"),
      });
    } finally {
      setOperationUserId(null);
    }
  };

  const toolbar = (
    <TableToolbar>
      <TableToolbar.Row justify="between">
        <TableToolbar.Section>
          <span className="text-xs font-semibold text-light-muted dark:text-dark-muted">
            {t("admin.users.table.count", {
              filtered: sortedItems.length,
              total: items.length,
            })}
          </span>
          <TableToolbar.IconButton
            iconOnly
            icon={
              <TableToolbarIcon
                icon={RefreshCw}
                className={clsx(tableToolbarIconClass, refreshing && "animate-spin")}
              />
            }
            onClick={onRefresh}
            disabled={refreshing || loading}
            aria-label={
              refreshing
                ? t("admin.users.action.refreshing")
                : t("admin.users.action.refresh")
            }
            title={
              refreshing
                ? t("admin.users.action.refreshing")
                : t("admin.users.action.refresh")
            }
          />
        </TableToolbar.Section>
        <TableToolbar.Section>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="btn-primary inline-flex min-h-10 items-center gap-2"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("admin.users.newUser")}
          </button>
        </TableToolbar.Section>
      </TableToolbar.Row>

      <TableToolbar.Row justify="start" className="gap-2">
        <div className="min-w-0 flex-1 sm:min-w-48">
          <InputField
            id="admin-users-search"
            placeholder={t("admin.users.searchPlaceholder")}
            value={searchInput}
            tone="light"
            onChange={(event) => setSearchInput(event.target.value)}
            containerClassName="mb-0"
          />
        </div>
        <div className="w-full shrink-0 sm:w-44">
          <SelectField
            tone="light"
            options={roleOptions}
            value={roleFilter}
            onValueChange={(value) => setRoleFilter(value as RoleFilter)}
            placeholder={t("admin.users.column.role")}
          />
        </div>
        <div className="w-full shrink-0 sm:w-44">
          <SelectField
            tone="light"
            options={statusOptions}
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as AccountStatusFilter)
            }
            placeholder={t("admin.users.column.status")}
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
          statusOptions={roleOptions}
          statusFilter={roleFilter}
          onStatusFilterChange={(value) => setRoleFilter(value as RoleFilter)}
          sortOptions={sortOptions}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortChange={(key, direction) => onSortChange(key as SortKey, direction)}
          columns={toolColumns}
          hiddenColumns={hiddenColumnsList}
          onToggleColumn={toggleColumn}
          onResetColumns={resetColumns}
          compactRows={compactRows}
          onToggleCompactRows={() => setCompactRows((value) => !value)}
        />
      </TableToolbar.Row>
    </TableToolbar>
  );

  if (loading) {
    return <AdminUsersTableSkeleton />;
  }

  return (
    <>
      <AdminCreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <ConfirmModal
        open={deleteTarget != null}
        title={t("admin.users.delete.confirmTitle")}
        description={t("admin.users.delete.confirmDescription", {
          name: deleteTarget?.name ?? "",
        })}
        confirmLabel={t("admin.users.delete.confirm")}
        cancelLabel={t("admin.users.delete.cancel")}
        closeLabel={t("admin.users.delete.close")}
        workingLabel={t("admin.users.delete.working")}
        tone="danger"
        submitting={deleteUserMutation.isPending}
        onClose={() => {
          if (!deleteUserMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
      <div className="overflow-hidden border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface dark:shadow-dark-sm">
        <Table toolbar={toolbar}>
          <TableHeader headerData={headerData} />
          <TableBody>
            {items.length === 0 ? (
              <DataTableEmptyState
                colSpan={headerData.length}
                title={t("admin.users.empty.title")}
                description={t("admin.users.empty.description")}
              />
            ) : sortedItems.length === 0 ? (
              <DataTableEmptyState
                colSpan={headerData.length}
                title={t("admin.users.empty.filteredTitle")}
                action={
                  hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-sm font-semibold text-primary-500 hover:underline"
                    >
                      {t("admin.users.action.clearFilters")}
                    </button>
                  ) : null
                }
              />
            ) : (
              pageItems.map((row) => (
                <TableRow
                  key={row.id}
                  className={compactRows ? "[&_td]:py-2" : undefined}
                >
                  {isColumnVisible("id") ? (
                    <TableColumn>
                      <span className="font-mono text-xs font-semibold text-light-text dark:text-dark-text">
                        {row.code || row.id.slice(0, 8)}
                      </span>
                    </TableColumn>
                  ) : null}

                  {isColumnVisible("user") ? (
                    <TableColumn nowrap={false}>
                      <p className="font-semibold text-light-text dark:text-dark-text">
                        {row.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">{row.username}</p>
                    </TableColumn>
                  ) : null}

                  {isColumnVisible("role") ? (
                    <TableColumn>
                      <span className="text-sm capitalize text-light-text dark:text-dark-text">
                        {row.role}
                      </span>
                    </TableColumn>
                  ) : null}

                  {isColumnVisible("email") ? (
                    <TableColumn>
                      <span className="text-sm text-light-text dark:text-dark-text">
                        {row.email || "—"}
                      </span>
                    </TableColumn>
                  ) : null}

                  {isColumnVisible("joined") ? (
                    <TableColumn className="text-sm text-muted">
                      {formatJoinedDate(row.createdAt, language)}
                    </TableColumn>
                  ) : null}

                  {isColumnVisible("status") ? (
                    <TableColumn>
                      <StatusPill
                        label={
                          row.isDeleted
                            ? t("admin.users.status.disabled")
                            : t("admin.users.status.active")
                        }
                        variant={accountStatusVariant(row)}
                      />
                    </TableColumn>
                  ) : null}

                  {isColumnVisible("actions") ? (
                    <TableColumn className="text-center">
                      <AdminUserRowActionsMenu
                        row={row}
                        busy={
                          operating &&
                          (operationUserId == null || operationUserId === row.id)
                        }
                        onDelete={setDeleteTarget}
                        onToggleStatus={(item) => void handleToggleStatus(item)}
                      />
                    </TableColumn>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {sortedItems.length > 0 ? (
          <Pagination
            meta={meta}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setCurrentPageSize(nextPageSize);
              setPage(1);
            }}
            disabled={refreshing}
          />
        ) : null}
      </div>
    </>
  );
}

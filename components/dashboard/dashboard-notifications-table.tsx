"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, Eye } from "lucide-react";
import DataTableEmptyState from "@/components/common/data-table-empty-state";
import { InputField } from "@/components/common/input-field";
import StatusPill from "@/components/common/status-pill";
import Table from "@/components/common/table";
import { tableShellClass } from "@/components/common/table-styles";
import TableBody from "@/components/common/table-body";
import TableColumn from "@/components/common/table-column";
import TableHeader from "@/components/common/table-header";
import TableRow from "@/components/common/table-row";
import TableToolbar from "@/components/common/table-tool-bar";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { appRoutes } from "@/routes/app-routes";
import type { AppNotification } from "@/services/notifications.service";

function notificationTypeLabel(type: string): string {
  switch (type) {
    case "account_status":
      return "Account";
    case "property_status":
      return "Moderation";
    case "listing_status":
      return "Listing";
    default:
      return "General";
  }
}

function notificationTypeVariant(
  type: string,
): "success" | "warning" | "error" | "neutral" {
  switch (type) {
    case "account_status":
      return "warning";
    case "property_status":
      return "neutral";
    case "listing_status":
      return "success";
    default:
      return "neutral";
  }
}

type DashboardNotificationsTableProps = {
  notifications: AppNotification[];
  loading?: boolean;
  onMarkRead: (notification: AppNotification) => void;
  formatTimestamp: (value: string) => string;
};

export function DashboardNotificationsTable({
  notifications,
  loading = false,
  onMarkRead,
  formatTimestamp,
}: DashboardNotificationsTableProps) {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const filtered = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return notifications.filter((item) => {
      if (filter === "unread" && item.read) return false;
      if (filter === "read" && !item.read) return false;
      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        item.message.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
      );
    });
  }, [debouncedSearch, filter, notifications]);

  return (
    <div className={tableShellClass}>
      <TableToolbar>
        <TableToolbar.Row justify="between" className="gap-3">
          <TableToolbar.ViewTabs
            value={filter}
            onValueChange={(value) => setFilter(value as typeof filter)}
            tabs={[
              { id: "all", label: "All" },
              { id: "unread", label: "Unread" },
              { id: "read", label: "Read" },
            ]}
          />
          <span className="text-xs font-semibold text-light-muted dark:text-dark-muted">
            {filtered.length} of {notifications.length}
          </span>
        </TableToolbar.Row>
        <TableToolbar.Row justify="start">
          <div className="min-w-0 flex-1 sm:max-w-xs">
            <InputField
              id="notifications-search"
              placeholder="Search notifications..."
              value={searchInput}
              tone="light"
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
        </TableToolbar.Row>
      </TableToolbar>

      <Table>
        <TableHeader
          headerData={[
            { title: " ", width: "3rem" },
            { title: "Title" },
            { title: "Type", width: "7rem" },
            { title: "Message" },
            { title: "Date", width: "10rem" },
            { title: "Actions", width: "8rem", align: "center" },
          ]}
        />
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`notification-skeleton-${index}`} disableHover>
                {Array.from({ length: 6 }).map((__, col) => (
                  <TableColumn key={col}>
                    <div className="h-4 animate-pulse rounded-none bg-light-border dark:bg-dark-border" />
                  </TableColumn>
                ))}
              </TableRow>
            ))
          ) : filtered.length === 0 ? (
            <DataTableEmptyState
              colSpan={6}
              title="No notifications match your filters."
            />
          ) : (
            filtered.map((notification) => (
              <TableRow
                key={notification.id}
                className={
                  notification.read
                    ? undefined
                    : "bg-primary-50/40 dark:bg-primary-500/5"
                }
              >
                <TableColumn>
                  {!notification.read ? (
                    <span
                      className="mx-auto block h-2.5 w-2.5 rounded-full bg-primary-500"
                      aria-label="Unread"
                    />
                  ) : (
                    <span className="mx-auto block h-2.5 w-2.5 rounded-full bg-light-border dark:bg-dark-border" />
                  )}
                </TableColumn>
                <TableColumn nowrap={false}>
                  <Link
                    href={appRoutes.dashboardNotificationDetail(
                      notification.id,
                      notification.source,
                    )}
                    className="font-semibold text-light-text transition hover:text-primary-600 dark:text-dark-text dark:hover:text-primary-500"
                    onClick={() => {
                      if (!notification.read) onMarkRead(notification);
                    }}
                  >
                    {notification.title}
                  </Link>
                </TableColumn>
                <TableColumn>
                  <StatusPill
                    label={notificationTypeLabel(notification.type)}
                    variant={notificationTypeVariant(notification.type)}
                  />
                </TableColumn>
                <TableColumn nowrap={false} className="max-w-md">
                  <p className="line-clamp-2 text-sm text-light-muted dark:text-dark-muted">
                    {notification.message}
                  </p>
                </TableColumn>
                <TableColumn className="text-sm text-light-muted dark:text-dark-muted">
                  {formatTimestamp(notification.createdAt)}
                </TableColumn>
                <TableColumn className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Link
                      href={appRoutes.dashboardNotificationDetail(
                      notification.id,
                      notification.source,
                    )}
                      className="inline-flex size-8 items-center justify-center border border-light-border text-light-text transition hover:border-primary-500 hover:text-primary-600 dark:border-dark-border dark:text-dark-text dark:hover:text-primary-500"
                      title="View details"
                      onClick={() => {
                        if (!notification.read) onMarkRead(notification);
                      }}
                    >
                      <Eye className="size-3.5" />
                    </Link>
                    {notification.href ? (
                      <Link
                        href={notification.href}
                        className="inline-flex size-8 items-center justify-center border border-light-border text-light-text transition hover:border-primary-500 hover:text-primary-600 dark:border-dark-border dark:text-dark-text dark:hover:text-primary-500"
                        title="Open related page"
                        onClick={() => {
                          if (!notification.read) onMarkRead(notification);
                        }}
                      >
                        <ExternalLink className="size-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </TableColumn>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

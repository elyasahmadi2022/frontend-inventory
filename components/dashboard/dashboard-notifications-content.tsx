"use client";
import { gooeyToast } from "goey-toast";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import Pagination from "@/components/common/pagination";
import { DashboardNotificationsTable } from "@/components/dashboard/dashboard-notifications-table";
import { useI18n } from "@/lib/i18n";
import { ApiError } from "@/lib/api";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "@/lib/query/hooks";
import { appRoutes } from "@/routes/app-routes";
import type { AppNotification } from "@/services/notifications.service";

function formatTimestamp(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function DashboardNotificationsContent() {
  const { t, language } = useI18n();
  const [page, setPage] = useState(1);
  const [optimisticUnread, setOptimisticUnread] = useState<number | null>(null);

  const {
    data: notificationsData,
    isLoading,
    isError,
    error,
  } = useNotificationsQuery({ page, pageSize: 20 });

  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  const notifications = notificationsData?.notifications ?? [];
  const unreadCount = optimisticUnread ?? notificationsData?.unreadCount ?? 0;
  const totalPages = notificationsData?.pagination?.totalPages ?? 1;
  const total = notificationsData?.pagination?.total ?? notifications.length;

  useEffect(() => {
    setOptimisticUnread(null);
  }, [notificationsData?.unreadCount]);

  useEffect(() => {
    if (!isError) return;
    gooeyToast.error(error instanceof ApiError
          ? error.message
          : t("dashboard.notifications.loadError"), {
        description: undefined,
      })
  }, [error, isError, t]);

  const handleMarkRead = async (notification: AppNotification) => {
    if (notification.read) return;

    setOptimisticUnread((current) =>
      Math.max(0, (current ?? notificationsData?.unreadCount ?? 0) - 1),
    );

    try {
      await markRead.mutateAsync({
        id: notification.id,
        source: notification.source,
      });
    } catch {
      setOptimisticUnread(null);
    }
  };

  const handleMarkAllRead = async () => {
    setOptimisticUnread(0);

    try {
      await markAllRead.mutateAsync();
      gooeyToast.success(t("dashboard.notifications.allRead"), {
        description: undefined,
      })
    } catch (markError) {
      setOptimisticUnread(null);
      gooeyToast.error(markError instanceof ApiError
            ? markError.message
            : t("dashboard.notifications.loadError"), {
        description: undefined,
      })
    }
  };

  return (
    <section className="mx-auto space-y-2">
      <div className="card-surface flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-500">
            {t("dashboard.notifications.eyebrow")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-light-text dark:text-dark-text">
            {t("dashboard.notifications.title")}
          </h1>
          <p className="mt-2 text-sm text-light-muted dark:text-dark-muted">
            {t("dashboard.notifications.description")}
          </p>
          {unreadCount > 0 ? (
            <p className="mt-2 text-sm font-medium text-primary-600 dark:text-primary-500">
              {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="inline-flex items-center justify-center rounded-none border border-light-border px-4 py-2 text-sm font-semibold text-light-text transition hover:border-primary-500 hover:text-primary-600 dark:border-dark-border dark:text-dark-text dark:hover:text-primary-500"
          >
            {t("notifications.markAllRead")}
          </button>
        ) : null}
      </div>

      {isLoading && notifications.length === 0 ? (
        <div className="card-surface flex items-center justify-center gap-2 py-16 text-sm text-light-muted dark:text-dark-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t("dashboard.notifications.loading")}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card-surface border-dashed text-center">
          <Bell
            className="mx-auto h-10 w-10 text-light-muted dark:text-dark-muted"
            aria-hidden="true"
          />
          <p className="mt-4 text-sm font-medium text-light-text dark:text-dark-text">
            {t("notifications.empty")}
          </p>
          <p className="mt-2 text-sm text-light-muted dark:text-dark-muted">
            {t("dashboard.notifications.emptyHint")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={appRoutes.profile} className="btn-primary">
              {t("dashboard.nav.profile")}
            </Link>
            <Link
              href={appRoutes.properties}
              className="inline-flex items-center justify-center rounded-none border border-light-border px-5 py-3 text-sm font-semibold text-light-text transition hover:border-primary-500 hover:text-primary-600 dark:border-dark-border dark:text-dark-text dark:hover:text-primary-500"
            >
              {t("dashboard.favorites.browse")}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <DashboardNotificationsTable
            notifications={notifications}
            loading={isLoading}
            onMarkRead={(item) => void handleMarkRead(item)}
            formatTimestamp={(value) => formatTimestamp(value, language)}
          />
          {totalPages > 1 ? (
            <Pagination
              meta={{
                page,
                pageSize: 20,
                total,
                totalPages,
              }}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}
    </section>
  );
}

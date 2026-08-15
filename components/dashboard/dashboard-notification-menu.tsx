"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SiteNotificationMenu,
  type NotificationItem,
} from "@/components/site-notification-menu";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
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

function toMenuItem(
  notification: AppNotification,
  locale: string,
): NotificationItem {
  return {
    id: String(notification.id),
    title: notification.title,
    message: notification.message,
    timestamp: formatTimestamp(notification.createdAt, locale),
    read: notification.read,
    href:
      notification.href ??
      (notification.type === "email_verification"
        ? appRoutes.dashboardVerifyEmail
        : appRoutes.dashboardNotificationDetail(
            notification.id,
            notification.source,
          )),
    source: notification.source,
  };
}

export function DashboardNotificationMenu() {
  const { t, language } = useI18n();
  const { user, status } = useAuth();
  const authenticated = status === "authenticated" && Boolean(user);
  const [optimisticUnread, setOptimisticUnread] = useState<number | null>(null);

  const { data: notificationsData } = useNotificationsQuery(
    { page: 1, pageSize: 8 },
    authenticated,
  );

  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  const notifications = notificationsData?.notifications ?? [];
  const unreadCount = optimisticUnread ?? notificationsData?.unreadCount ?? 0;


  const menuItems = useMemo(
    () => notifications.map((item) => toMenuItem(item, language)),
    [language, notifications],
  );

  const handleNotificationSelect = useCallback(
    async (item: NotificationItem) => {
      const id = Number(item.id);
      if (!Number.isFinite(id) || item.read) return;

      setOptimisticUnread((current) =>
        Math.max(0, (current ?? notificationsData?.unreadCount ?? 0) - 1),
      );

      try {
        const source =
          item.source === "user" || item.source === "owner"
            ? item.source
            : "owner";
        await markRead.mutateAsync({ id, source });
      } catch {
        setOptimisticUnread(null);
      }
    },
    [markRead, notificationsData?.unreadCount],
  );

  const handleMarkAllRead = useCallback(async () => {
    setOptimisticUnread(0);

    try {
      await markAllRead.mutateAsync();
    } catch {
      setOptimisticUnread(null);
    }
  }, [markAllRead]);

  if (!authenticated) {
    return (
      <SiteNotificationMenu
        notifications={[]}
        unreadCount={0}
        emptyMessage={t("notifications.signInHint")}
      />
    );
  }

  return (
    <SiteNotificationMenu
      notifications={menuItems}
      unreadCount={unreadCount}
      onMarkAllRead={handleMarkAllRead}
      onNotificationSelect={handleNotificationSelect}
    />
  );
}

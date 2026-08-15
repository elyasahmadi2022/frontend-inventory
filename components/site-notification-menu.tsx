"use client";

import { type ReactNode } from "react";
import {
  DropdownContent,
  DropdownLinkItem,
  DropdownLabel,
  DropdownMenuRoot,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/common";
import { useI18n } from "@/lib/i18n";
import { appRoutes } from "@/routes/app-routes";

export type NotificationItem = {
  id: string;
  title: string;
  message?: string;
  timestamp?: string;
  read?: boolean;
  href?: string;
  source?: "user" | "owner";
  onClick?: () => void;
};

type SiteNotificationMenuProps = {
  /** Structured notification rows. Ignored when `children` is provided. */
  notifications?: NotificationItem[];
  /** Custom panel body (overrides the default notification list). */
  children?: ReactNode;
  /** Unread badge count. Defaults to unread items in `notifications`. */
  unreadCount?: number;
  title?: string;
  emptyMessage?: string;
  markAllReadLabel?: string;
  viewAllLabel?: string;
  viewAllHref?: string;
  onMarkAllRead?: () => void;
  onNotificationSelect?: (notification: NotificationItem) => void;
  align?: "start" | "center" | "end";
  className?: string;
  contentClassName?: string;
};

function NotificationIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function NotificationRowContent({
  notification,
}: {
  notification: NotificationItem;
}) {
  const unread = !notification.read;

  return (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={`block truncate text-sm text-inherit ${
            unread ? "font-semibold" : "font-medium"
          }`}
        >
          {notification.title}
        </span>
        {notification.message ? (
          <span className="line-clamp-2 text-xs text-inherit opacity-70 group-data-[highlighted]:opacity-90">
            {notification.message}
          </span>
        ) : null}
        {notification.timestamp ? (
          <span className="text-[11px] text-inherit opacity-60 group-data-[highlighted]:opacity-85">
            {notification.timestamp}
          </span>
        ) : null}
      </span>
      {unread ? (
        <span
          className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500 group-data-[highlighted]:bg-white"
          aria-hidden="true"
        />
      ) : null}
    </>
  );
}

function NotificationRow({
  notification,
  onSelect,
}: {
  notification: NotificationItem;
  onSelect?: (notification: NotificationItem) => void;
}) {
  const handleSelect = () => {
    notification.onClick?.();
    onSelect?.(notification);
  };

  const detailHref =
    notification.href ??
    appRoutes.dashboardNotificationDetail(notification.id);

  return (
    <DropdownLinkItem
      href={detailHref}
      className="items-start py-2.5 text-light-text dark:text-dark-text"
      onSelect={handleSelect}
    >
      <NotificationRowContent notification={notification} />
    </DropdownLinkItem>
  );
}

export function SiteNotificationMenu({
  notifications = [],
  children,
  unreadCount,
  title,
  emptyMessage,
  markAllReadLabel,
  viewAllLabel,
  viewAllHref = appRoutes.dashboardNotifications,
  onMarkAllRead,
  onNotificationSelect,
  align = "end",
  className,
  contentClassName,
}: SiteNotificationMenuProps) {
  const { t } = useI18n();

  const resolvedUnreadCount =
    unreadCount ??
    notifications.filter((notification) => !notification.read).length;

  const resolvedTitle = title ?? t("notifications.title");
  const resolvedEmptyMessage = emptyMessage ?? t("notifications.empty");
  const resolvedMarkAllReadLabel =
    markAllReadLabel ?? t("notifications.markAllRead");
  const resolvedViewAllLabel =
    viewAllLabel ?? t("dashboard.notifications.viewAll");

  const showMarkAllRead =
    Boolean(onMarkAllRead) && resolvedUnreadCount > 0 && !children;

  return (
    <DropdownMenuRoot>
      <DropdownTrigger
        compact
        tone="neutral"
        showArrow={false}
        aria-label={t("notifications.openMenu")}
        className={`relative ${className ?? ""}`}
      >
        <span className="flex h-full w-full items-center justify-center">
          <NotificationIcon />
        </span>
        {resolvedUnreadCount > 0 ? (
          <span className="absolute -inset-e-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-500 px-1 text-[10px] font-bold leading-none text-white">
            {resolvedUnreadCount > 99 ? "99+" : resolvedUnreadCount}
          </span>
        ) : null}
      </DropdownTrigger>
      <DropdownContent
        align={align}
        className={`w-80 max-w-[calc(100vw-2rem)] p-0 ${contentClassName ?? ""}`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-light-border px-3 py-2.5 dark:border-dark-border">
          <DropdownLabel className="p-0 normal-case tracking-normal text-light-text dark:text-dark-text">
            {resolvedTitle}
          </DropdownLabel>
          {showMarkAllRead ? (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="shrink-0 text-xs font-medium text-primary-600 transition hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 dark:text-primary-500 dark:hover:text-primary-400"
            >
              {resolvedMarkAllReadLabel}
            </button>
          ) : null}
        </div>

        {children ? (
          <div className="p-1.5">{children}</div>
        ) : notifications.length > 0 ? (
          <>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <NotificationRow
                    notification={notification}
                    onSelect={onNotificationSelect}
                  />
                  {index < notifications.length - 1 ? (
                    <DropdownSeparator />
                  ) : null}
                </div>
              ))}
            </div>
            <div className="border-t border-light-border p-1.5 dark:border-dark-border">
              <DropdownLinkItem
                href={viewAllHref}
                className="justify-center text-center text-sm font-semibold"
              >
                {resolvedViewAllLabel}
              </DropdownLinkItem>
            </div>
          </>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-light-muted dark:text-dark-muted">
            {resolvedEmptyMessage}
          </div>
        )}
      </DropdownContent>
    </DropdownMenuRoot>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  ArrowLeft,
  Bell,
  Building2,
  CheckCircle2,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import StatusPill from "@/components/common/status-pill";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  useMarkNotificationReadMutation,
  useNotificationQuery,
} from "@/lib/query/hooks";
import { appRoutes } from "@/routes/app-routes";

function formatTimestamp(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

function notificationIcon(type: string) {
  switch (type) {
    case "account_status":
      return ShieldCheck;
    case "property_status":
      return Building2;
    case "listing_status":
      return CheckCircle2;
    case "email_verification":
      return ShieldCheck;
    default:
      return Bell;
  }
}

function notificationTypeLabel(type: string): string {
  switch (type) {
    case "account_status":
      return "Account verification";
    case "property_status":
      return "Property moderation";
    case "listing_status":
      return "Listing update";
    case "email_verification":
      return "Verify your email";
    default:
      return "Notification";
  }
}

type DashboardNotificationDetailContentProps = {
  notificationId: number;
  source?: "user" | "owner";
};

export function DashboardNotificationDetailContent({
  notificationId,
  source = "owner",
}: DashboardNotificationDetailContentProps) {
  const { language } = useI18n();
  const markedReadRef = useRef(false);

  const {
    data: notification,
    isLoading,
    isError,
    error,
  } = useNotificationQuery(notificationId, source);

  const markRead = useMarkNotificationReadMutation();

  useEffect(() => {
    if (!notification || notification.read || markedReadRef.current) return;
    markedReadRef.current = true;
    void markRead.mutateAsync({
      id: notification.id,
      source: notification.source,
    });
  }, [markRead, notification]);

  if (isLoading) {
    return (
      <div className="card-surface flex items-center justify-center gap-2 py-20 text-sm text-light-muted dark:text-dark-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading notification…
      </div>
    );
  }

  const errorMessage =
    isError && error instanceof ApiError
      ? error.message
      : isError
        ? "Could not load notification."
        : null;

  if (errorMessage || !notification) {
    return (
      <div className="card-surface border-dashed p-8 text-center">
        <Bell className="mx-auto size-10 text-light-muted dark:text-dark-muted" />
        <p className="mt-4 text-sm font-medium text-light-text dark:text-dark-text">
          {errorMessage ?? "Notification not found"}
        </p>
        <Link
          href={appRoutes.dashboardNotifications}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:underline dark:text-primary-500"
        >
          <ArrowLeft className="size-4" />
          Back to notifications
        </Link>
      </div>
    );
  }

  const Icon = notificationIcon(notification.type);

  return (
    <section className="mx-auto w-full space-y-2">
      <Link
        href={appRoutes.dashboardNotifications}
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 transition hover:underline dark:text-primary-500"
      >
        <ArrowLeft className="size-4" />
        Back to notifications
      </Link>

      <article className="overflow-hidden border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <div className="border-b border-light-border bg-linear-to-br from-primary-50 via-light-surface to-light-bg px-6 py-8 dark:border-dark-border dark:from-primary-500/10 dark:via-dark-surface dark:to-dark-bg sm:px-8">
          <div className="flex flex-wrap items-start gap-4">
            <span className="inline-flex size-14 shrink-0 items-center justify-center border border-primary-500/20 bg-white text-primary-600 dark:bg-dark-bg dark:text-primary-500">
              <Icon className="size-7" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill
                  label={notification.read ? "Read" : "Unread"}
                  variant={notification.read ? "neutral" : "success"}
                />
                <StatusPill
                  label={notificationTypeLabel(notification.type)}
                  variant="neutral"
                />
              </div>
              <h1 className="headline-luxury mt-3 text-2xl sm:text-3xl">
                {notification.title}
              </h1>
              <p className="mt-2 text-sm text-light-muted dark:text-dark-muted">
                {formatTimestamp(notification.createdAt, language)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 py-8 sm:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-500">
              Message
            </p>
            <p className="mt-3 text-base leading-relaxed text-light-text dark:text-dark-text">
              {notification.message}
            </p>
          </div>

          {notification.href ? (
            <div className="border border-light-border bg-light-bg p-5 dark:border-dark-border dark:bg-dark-bg">
              <p className="text-sm font-semibold text-light-text dark:text-dark-text">
                Recommended next step
              </p>
              <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
                Open the related page to review details or take action.
              </p>
              <Link
                href={notification.href}
                className="btn-primary mt-4 inline-flex min-h-10 items-center gap-2 rounded-none"
              >
                <ExternalLink className="size-4" />
                Open related page
              </Link>
            </div>
          ) : null}
        </div>
      </article>
    </section>
  );
}

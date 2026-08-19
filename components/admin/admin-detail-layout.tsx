"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function AdminInvalidIdState({ label = "record" }: { label?: string }) {
  return (
    <div className="border border-red-400/30 bg-red-50 p-6 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-300">
      Invalid {label} ID.
    </div>
  );
}

export function AdminRecordNotFound({
  backHref,
  backLabel,
  message = "Record could not be loaded.",
}: {
  backHref: string;
  backLabel: string;
  message?: string;
}) {
  return (
    <div className="space-y-1">
      <AdminDetailBackLink href={backHref} label={backLabel} />
      <div className="border border-red-400/30 bg-red-50 p-6 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-300">
        {message}
      </div>
    </div>
  );
}

export function AdminDetailPageSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-10 w-48 animate-pulse border border-light-border bg-light-border/40 dark:border-dark-border dark:bg-dark-border/40" />
      <div className="h-32 animate-pulse border border-light-border bg-light-border/40 dark:border-dark-border dark:bg-dark-border/40" />
      <div className="h-64 animate-pulse border border-light-border bg-light-border/40 dark:border-dark-border dark:bg-dark-border/40" />
    </div>
  );
}

export function AdminDetailBackLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 transition hover:underline dark:text-primary-500"
    >
      <ArrowLeft className="size-4" />
      {label}
    </Link>
  );
}

type AdminDetailToolbarProps = {
  backHref: string;
  backLabel: string;
  onRefresh?: () => void;
  actions?: ReactNode;
};

export function AdminDetailToolbar({
  backHref,
  backLabel,
  onRefresh,
  actions,
}: AdminDetailToolbarProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2 px-2 bg-white">
      <AdminDetailBackLink href={backHref} label={backLabel} />
      <div className="flex flex-wrap items-center gap-2">
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="btn-primary inline-flex min-h-9 items-center gap-2 px-3 text-xs"
          >
            <RefreshCw className="size-3.5" />
            {t("common.refresh")}
          </button>
        ) : null}
        {actions}
      </div>
    </div>
  );
}

export function AdminDetailField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="border border-light-border bg-light-bg p-4 dark:border-dark-border dark:bg-dark-bg">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <div className="mt-1.5 text-sm text-light-text dark:text-dark-text">
        {value}
      </div>
    </div>
  );
}

export function AdminDetailSection({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-light-text dark:text-dark-text">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-muted">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function formatAdminDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

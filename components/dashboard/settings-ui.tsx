"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const panelClass =
  "overflow-hidden border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface dark:shadow-dark-sm";

export function SettingsPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={panelClass}>
      <header className="border-b border-light-border px-5 py-4 sm:px-6 dark:border-dark-border">
        <h2 className="text-lg font-semibold text-light-text dark:text-dark-text">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
            {description}
          </p>
        ) : null}
      </header>
      <div className="divide-y divide-light-border dark:divide-dark-border">
        {children}
      </div>
    </section>
  );
}

export function SettingsRow({
  label,
  description,
  children,
  className = "",
  stackOnMobile = true,
}: {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** When false, label and control stay on one row (e.g. toggle switches). */
  stackOnMobile?: boolean;
}) {
  return (
    <div
      className={`flex gap-3 px-5 py-4 sm:px-6 ${
        stackOnMobile
          ? "flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-6"
          : "flex-row items-center justify-between gap-4"
      } ${className}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-light-text dark:text-dark-text">
          {label}
        </p>
        {description ? (
          <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
            {description}
          </p>
        ) : null}
      </div>
      <div
        className={
          stackOnMobile
            ? "shrink-0 sm:flex sm:max-w-[min(100%,22rem)] sm:flex-1 sm:justify-end sm:text-end"
            : "ms-2 shrink-0"
        }
      >
        {children}
      </div>
    </div>
  );
}

export function SettingsLinkRow({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  description?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 px-5 py-4 transition hover:bg-light-bg/80 sm:px-6 dark:hover:bg-dark-bg/50"
    >
      <span className="inline-flex size-10 shrink-0 items-center justify-center border border-light-border bg-light-bg text-primary-600 dark:border-dark-border dark:bg-dark-bg dark:text-primary-500">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-light-text group-hover:text-primary-600 dark:text-dark-text dark:group-hover:text-primary-500">
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-sm text-light-muted dark:text-dark-muted">
            {description}
          </span>
        ) : null}
      </span>
      <span className="text-light-muted transition group-hover:translate-x-0.5 group-hover:text-primary-600 dark:text-dark-muted dark:group-hover:text-primary-500">
        →
      </span>
    </Link>
  );
}

export function SettingsFieldBlock({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 px-5 py-4 sm:px-6">
      <div>
        <p className="text-sm font-medium text-light-text dark:text-dark-text">
          {label}
        </p>
        {description ? (
          <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function SettingsDangerPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden border border-red-200 bg-red-50/70 shadow-sm dark:border-red-500/30 dark:bg-red-500/5 dark:shadow-dark-sm">
      <header className="border-b border-red-200 px-5 py-4 sm:px-6 dark:border-red-500/30">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-red-700/80 dark:text-red-300/80">
            {description}
          </p>
        ) : null}
      </header>
      <div className="divide-y divide-red-200 dark:divide-red-500/20">
        {children}
      </div>
    </section>
  );
}

export function SettingsCategoryNav({
  label,
  ariaLabel,
  children,
}: {
  label: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className="rounded-none border border-light-border bg-light-surface p-4  dark:border-dark-border dark:bg-dark-surface dark:shadow-dark-sm sm:p-5"
    >
      <p className="mb-3 hidden text-xs font-semibold uppercase tracking-wide text-light-muted lg:block dark:text-dark-muted">
        {label}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {children}
      </div>
    </nav>
  );
}

export function SettingsCategoryButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full shrink-0 items-center gap-2 rounded-none  px-3 py-2 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 lg:px-4 lg:py-2 ${
        active
          ? "border border-primary-500 bg-light-surface text-primary-600 shadow-sm ring-1 ring-primary-500/15 dark:border-primary-500 dark:bg-dark-surface dark:text-primary-500 dark:ring-primary-500/20"
          : "border-light-border bg-light-surface text-light-text hover:border-primary-500/35 hover:text-primary-600 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text dark:hover:border-primary-500/40 dark:hover:text-primary-500"
      }`}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </button>
  );
}

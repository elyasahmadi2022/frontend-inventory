"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  ADMIN_SETTINGS_MVP_SECTIONS,
  ADMIN_SETTINGS_SECTIONS,
} from "@/lib/admin/admin-settings-catalog";
import { useI18n } from "@/lib/i18n";
import { appRoutes } from "@/routes/app-routes";

export function AdminSettingsOverview() {
  const { t } = useI18n();

  return (
    <div className="space-y-1">
      <AdminPageHeader
        eyebrow={t("admin.settings.overview.eyebrow")}
        title={t("admin.settings.overview.title")}
        description={t("admin.settings.overview.description")}
      />

      <section className="border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface dark:shadow-dark-xs">
        <div className="border-b border-light-border px-5 py-4 dark:border-dark-border sm:px-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-light-text dark:text-dark-text">
            {t("admin.settings.overview.mvpTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {t("admin.settings.overview.mvpDescription", {
              count: ADMIN_SETTINGS_MVP_SECTIONS.length,
            })}
          </p>
        </div>
        <ul className="grid gap-px bg-light-border p-px dark:bg-dark-border sm:grid-cols-2 xl:grid-cols-3">
          {ADMIN_SETTINGS_MVP_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <li key={section.id} className="bg-light-surface dark:bg-dark-surface">
                <Link
                  href={appRoutes.adminSettingsSection(section.id)}
                  className="group flex h-full items-start gap-3 p-4 transition hover:bg-primary-50/70 dark:hover:bg-primary-500/5 sm:p-5"
                >
                  <span className="inline-flex size-10 shrink-0 items-center justify-center border border-primary-500/25 bg-primary-50 text-primary-600 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-400">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-light-text group-hover:text-primary-700 dark:text-dark-text dark:group-hover:text-primary-300">
                        {t(section.labelKey)}
                      </span>
                      <span className="rounded-sm bg-primary-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
                        {t("admin.settings.overview.mvpBadge")}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">
                      {t(section.descriptionKey)}
                    </span>
                  </span>
                  <ChevronRight
                    className="mt-1 size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary-600 dark:group-hover:text-primary-400"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface dark:shadow-dark-xs">
        <div className="border-b border-light-border px-5 py-4 dark:border-dark-border sm:px-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-light-text dark:text-dark-text">
            {t("admin.settings.overview.allTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {t("admin.settings.overview.allDescription", {
              count: ADMIN_SETTINGS_SECTIONS.length,
            })}
          </p>
        </div>
        <ul className="grid gap-px bg-light-border p-px dark:bg-dark-border sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_SETTINGS_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <li key={section.id} className="bg-light-surface dark:bg-dark-surface">
                <Link
                  href={appRoutes.adminSettingsSection(section.id)}
                  className="group flex items-center gap-2.5 px-3 py-3 text-sm transition hover:bg-light-bg dark:hover:bg-dark-bg sm:px-4"
                >
                  <Icon
                    className="size-4 shrink-0 text-muted transition group-hover:text-primary-500 dark:group-hover:text-primary-400"
                    aria-hidden="true"
                  />
                  <span className="truncate font-medium text-light-text group-hover:text-primary-500 dark:text-dark-text dark:group-hover:text-primary-300">
                    {t(section.labelKey)}
                  </span>
                  {section.mvp ? (
                    <span className="ms-auto shrink-0 text-[10px] font-semibold uppercase tracking-wide text-primary-500 dark:text-primary-400">
                      {t("admin.settings.overview.mvpBadge")}
                    </span>
                  ) : (
                    <ChevronRight
                      className="ms-auto size-3.5 shrink-0 text-muted opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-primary-500 dark:group-hover:text-primary-400"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

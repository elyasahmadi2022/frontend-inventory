"use client";

import { AdminAccountMenuContent } from "@/components/account-menu/admin-account-menu-content";
import { DashboardCalendarMenu } from "@/components/dashboard/dashboard-calendar-menu";
import { DashboardCurrencyMenu } from "@/components/dashboard/dashboard-currency-menu";
import { DashboardNotificationMenu } from "@/components/dashboard/dashboard-notification-menu";
import { SiteAccountMenu } from "@/components/site-account-menu";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

type AdminTopBarProps = {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
};

const menuButtonClass =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-light-border bg-light-bg text-light-text transition hover:border-primary-500 hover:bg-primary-50 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:hover:border-primary-500 dark:hover:bg-primary-500/10 dark:hover:text-primary-500 md:hidden";

export function AdminTopBar({
  title,
  onMenuClick,
}: AdminTopBarProps) {
  const { t } = useI18n();
  const { user, status } = useAuth();
  const accountUser = status === "loading" ? undefined : user;

  return (
    <header className="sticky top-0 z-30 border-b border-light-border bg-light-surface/95 shadow-xs backdrop-blur-md dark:border-dark-border dark:bg-dark-surface/95 dark:shadow-dark-xs">
      <div className="flex items-center justify-between gap-4 px-4 py-2 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className={menuButtonClass}
            aria-label={t("admin.header.openMenu")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-light-text md:text-lg dark:text-dark-text">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <DashboardNotificationMenu />
          <DashboardCurrencyMenu />
          <DashboardCalendarMenu />
          <SiteAccountMenu user={accountUser} variant="toolbar">
            {user ? <AdminAccountMenuContent user={user} /> : null}
          </SiteAccountMenu>
        </div>
      </div>
    </header>
  );
}

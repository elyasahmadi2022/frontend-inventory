"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { SiteAccountMenu } from "@/components/site-account-menu";
import { DashboardAccountMenuContent } from "@/components/account-menu/dashboard-account-menu-content";
import { DashboardCalendarMenu } from "@/components/dashboard/dashboard-calendar-menu";
import { DashboardCurrencyMenu } from "@/components/dashboard/dashboard-currency-menu";
import { DashboardNotificationMenu } from "@/components/dashboard/dashboard-notification-menu";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { appRoutes } from "@/routes/app-routes";

type HeaderProps = {
  isMobile: boolean;
  mobileMenuOpen: boolean;
  handleSidebarToggle: () => void;
};

const menuButtonClass =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-light-border bg-light-bg text-light-text transition hover:border-primary-500 hover:bg-primary-50 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:hover:border-primary-500 dark:hover:bg-primary-500/10 dark:hover:text-primary-500 md:hidden";

function useDashboardHeaderTitle(): { title: string; subtitle?: string } {
  const pathname = usePathname();
  const { t } = useI18n();

  return useMemo(() => {
    if (pathname === appRoutes.dashboard) {
      return { title: "Store overview" };
    }
    if (pathname.startsWith(appRoutes.dashboardSales)) {
      return { title: "Sales", subtitle: "Invoices and customer receipts" };
    }
    if (pathname.startsWith(appRoutes.dashboardPurchases)) {
      return { title: "Purchases", subtitle: "Vendor bills and stock receipts" };
    }
    if (pathname.startsWith(appRoutes.dashboardProducts)) {
      return { title: "Products & Stock", subtitle: "Products, prices, and inventory" };
    }
    if (pathname.startsWith(appRoutes.dashboardPartners)) {
      return { title: "Customers & Vendors", subtitle: "Partner ledgers and profiles" };
    }
    if (pathname.startsWith(appRoutes.dashboardAccounts)) {
      return { title: "Accounts", subtitle: "Cash, bank, sarafi, and ledger balances" };
    }
    if (pathname.startsWith(appRoutes.dashboardTransfers)) {
      return { title: "Transfers", subtitle: "Money movement between accounts" };
    }
    if (pathname.startsWith(appRoutes.dashboardReports)) {
      return { title: "Reports", subtitle: "Daily, monthly, account, and inventory reports" };
    }
    if (pathname.startsWith(appRoutes.profile)) {
      return { title: "My Profile" };
    }
    if (pathname.startsWith(appRoutes.dashboardNotifications)) {
      return { title: t("dashboard.nav.notifications") };
    }
    if (pathname.startsWith(appRoutes.dashboardSettings)) {
      if (pathname.startsWith(appRoutes.dashboardBecomeOwner)) {
        return {
          title: t("dashboard.settings.ownerRequest.title")
        };
      }
      return { title: t("dashboard.nav.settings") };
    }
    return { title: t("dashboard.nav.overview") };
  }, [pathname, t]);
}

export function Header({
  mobileMenuOpen,
  handleSidebarToggle,
}: HeaderProps) {
  const { t } = useI18n();
  const { user, status } = useAuth();
  const accountUser = status === "loading" ? undefined : user;
  const { title } = useDashboardHeaderTitle();

  return (
    <header className="sticky top-0 z-30 border-b border-light-border bg-light-surface/95 shadow-xs backdrop-blur-md dark:border-dark-border dark:bg-dark-surface/95 dark:shadow-dark-xs">
      <div className="flex items-center justify-between gap-4 px-4 py-2 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={handleSidebarToggle}
            className={menuButtonClass}
            aria-label={t("dashboard.header.openMenu")}
            aria-expanded={mobileMenuOpen}
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
            <h1 className="truncate text-[14px] font-semibold text-light-text md:text-lg dark:text-dark-text">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <DashboardNotificationMenu />
          <DashboardCurrencyMenu />
          <DashboardCalendarMenu />
          <SiteAccountMenu user={accountUser} variant="toolbar">
            {user ? <DashboardAccountMenuContent user={user} /> : null}
          </SiteAccountMenu>
        </div>
      </div>
    </header>
  );
}

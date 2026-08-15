"use client";

import { useMemo } from "react";
import {
  Bell,
  BarChart3,
  Building2,
  CreditCard,
  LayoutDashboard,
  PackageSearch,
  ReceiptText,
  Settings,
  ShoppingCart,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useSidebar } from "@/context/LayoutContext";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { appRoutes } from "@/routes/app-routes";
import { Header } from "../header";
import { Sidebar } from "../side-bar";
import { DashboardEmailVerificationBanner } from "../dashboard/dashboard-email-verification-banner";
import { DashboardEmailVerificationModal } from "../dashboard/dashboard-email-verification-modal";

type DashboardNavItem = {
  key: string;
  labelKey: TranslationKey;
  Icon: LucideIcon;
  path: string;
  matchPrefix?: boolean;
  requiredPermission?: string;
};

type DashboardLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const {
    isMobile,
    setMobileMenuOpen,
    mobileMenuOpen,
    handleSidebarToggle,
    collapsed,
  } = useSidebar();

  const navItems = useMemo((): DashboardNavItem[] => {
    const permissions = new Set(user?.permissions ?? []);
    const can = (permission: string) =>
      user?.role === "admin" || permissions.has(permission);
    const items: DashboardNavItem[] = [
      {
        key: "dashboard",
        labelKey: "dashboard.nav.overview",
        Icon: LayoutDashboard,
        path: appRoutes.dashboard,
      },
      {
        key: "sales",
        labelKey: "dashboard.nav.sales",
        Icon: ShoppingCart,
        path: appRoutes.dashboardSales,
        matchPrefix: true,
        requiredPermission: "sales.manage",
      },
      {
        key: "purchases",
        labelKey: "dashboard.nav.purchases",
        Icon: ReceiptText,
        path: appRoutes.dashboardPurchases,
        matchPrefix: true,
        requiredPermission: "purchases.manage",
      },
      {
        key: "products",
        labelKey: "dashboard.nav.products",
        Icon: PackageSearch,
        path: appRoutes.dashboardProducts,
        matchPrefix: true,
        requiredPermission: "products.manage",
      },
      {
        key: "partners",
        labelKey: "dashboard.nav.partners",
        Icon: Building2,
        path: appRoutes.dashboardPartners,
        matchPrefix: true,
        requiredPermission: "partners.manage",
      },
      {
        key: "accounts",
        labelKey: "dashboard.nav.accounts",
        Icon: Wallet,
        path: appRoutes.dashboardAccounts,
        matchPrefix: true,
        requiredPermission: "accounts.manage",
      },
      {
        key: "transfers",
        labelKey: "dashboard.nav.transfers",
        Icon: CreditCard,
        path: appRoutes.dashboardTransfers,
        matchPrefix: true,
        requiredPermission: "payments.manage",
      },
      {
        key: "reports",
        labelKey: "dashboard.nav.reports",
        Icon: BarChart3,
        path: appRoutes.dashboardReports,
        matchPrefix: true,
        requiredPermission: "reports.view",
      },
      {
        key: "notifications",
        labelKey: "dashboard.nav.notifications",
        Icon: Bell,
        path: appRoutes.dashboardNotifications,
      },
      {
        key: "settings",
        labelKey: "dashboard.nav.settings",
        Icon: Settings,
        path: appRoutes.dashboardSettings,
      },
    ];
    return items.filter((item) => !item.requiredPermission || can(item.requiredPermission));
  }, [user?.permissions, user?.role]);

  return (
    <div className="mx-auto flex h-screen w-full max-w-384 bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text">
      {isMobile && mobileMenuOpen ? (
        <button
          type="button"
          aria-label={t("dashboard.header.closeMenu")}
          className="fixed inset-0 z-40 bg-black/50 dark:bg-black/60"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      <div className="flex flex-1 overflow-hidden">
        <div
          className={[
            isMobile ? "fixed z-50 h-full" : "relative",
            isMobile && !mobileMenuOpen ? "hidden" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Sidebar
            collapsed={collapsed}
            mobileMenuOpen={mobileMenuOpen}
            handleSidebarToggle={handleSidebarToggle}
            isMobile={isMobile}
            navItems={navItems}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header
            isMobile={isMobile}
            mobileMenuOpen={mobileMenuOpen}
            handleSidebarToggle={handleSidebarToggle}
          />
          <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-1 md:p-2">
            <div className="scrollbar-gutter-stable min-h-0 flex-1 overflow-y-auto scrollbar-thin">
              <DashboardEmailVerificationBanner />
              <DashboardEmailVerificationModal />
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

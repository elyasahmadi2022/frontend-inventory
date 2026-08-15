import {
  BarChart3,
  BookOpenText,
  Building2,
  CreditCard,
  Landmark,
  LayoutDashboard,
  PackageSearch,
  Settings,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { appRoutes } from "@/routes/app-routes";
import {
  getAdminSettingsSection,
  isAdminSettingsSectionId,
} from "@/lib/admin/admin-settings-catalog";
import type { TranslationKey } from "@/lib/i18n";

export type AdminNavItem = {
  key: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  href: string;
  matchPrefix?: boolean;
  /** When set, active state uses this prefix instead of `href` (for section roots). */
  activePrefix?: string;
  /** Additional paths that belong to this navigation section. */
  activePrefixes?: string[];
  requiredPermission?: string;
};

export const adminNavigation: AdminNavItem[] = [
  {
    key: "dashboard",
    labelKey: "admin.nav.dashboard",
    icon: LayoutDashboard,
    href: appRoutes.adminDashboard,
  },
  {
    key: "journals",
    labelKey: "admin.nav.journals",
    icon: BookOpenText,
    href: appRoutes.adminJournals,
    matchPrefix: true,
  },
  {
    key: "partners",
    labelKey: "admin.nav.partners",
    icon: Building2,
    href: appRoutes.adminPartners,
    matchPrefix: true,
  },
  {
    key: "products",
    labelKey: "admin.nav.products",
    icon: PackageSearch,
    href: appRoutes.adminProducts,
    matchPrefix: true,
  },
  {
    key: "sales-and-purchases",
    labelKey: "admin.nav.salesAndPurchases",
    icon: ShoppingCart,
    href: appRoutes.adminSales,
    matchPrefix: true,
    activePrefixes: [appRoutes.adminSales, appRoutes.adminPurchases],
  },

  {
    key: "accounts",
    labelKey: "admin.nav.accounts",
    icon: Landmark,
    href: appRoutes.adminAccounts,
    matchPrefix: true,
    requiredPermission: "accounts.manage",
  },
  {
    key: "transfers",
    labelKey: "admin.nav.transfers",
    icon: CreditCard,
    href: appRoutes.adminTransfers,
    matchPrefix: true,
  },
  {
    key: "reports",
    labelKey: "admin.nav.reports",
    icon: BarChart3,
    href: appRoutes.adminReports,
    matchPrefix: true,
  },

  {
    key: "settings",
    labelKey: "admin.nav.settings",
    icon: Settings,
    href: appRoutes.adminSettings,
    matchPrefix: true,
  },
];

const SECTION_PREFIXES: { prefix: string; labelKey: TranslationKey }[] = [
  { prefix: appRoutes.adminJournals, labelKey: "admin.nav.journals" },
  { prefix: appRoutes.adminSales, labelKey: "admin.nav.sales" },
  { prefix: appRoutes.adminPurchases, labelKey: "admin.nav.purchases" },
  { prefix: appRoutes.adminProducts, labelKey: "admin.nav.products" },
  { prefix: appRoutes.adminPartners, labelKey: "admin.nav.partners" },
  { prefix: appRoutes.adminAccounts, labelKey: "admin.nav.accounts" },
  { prefix: appRoutes.adminTransfers, labelKey: "admin.nav.transfers" },
  { prefix: appRoutes.adminReports, labelKey: "admin.nav.reports" },
  { prefix: "/admin/payments", labelKey: "admin.nav.operations" },
  { prefix: "/admin/settings", labelKey: "admin.nav.settings" },
];

function pathMatches(
  href: string,
  pathname: string,
  matchPrefix = false,
): boolean {
  if (matchPrefix) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href;
}

export function isAdminNavItemActive(
  item: AdminNavItem,
  pathname: string,
): boolean {
  if (item.activePrefixes) {
    return item.activePrefixes.some((prefix) =>
      pathMatches(prefix, pathname, true),
    );
  }
  const base = item.activePrefix ?? item.href;
  return pathMatches(
    base,
    pathname,
    item.matchPrefix ?? Boolean(item.activePrefix),
  );
}

function titleFromPathSegment(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean).pop() ?? "";
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

type TranslateFn = (key: TranslationKey) => string;

export function getAdminHeaderForPath(
  pathname: string,
  t: TranslateFn,
): {
  title: string;
  subtitle: string;
} {
  for (const item of adminNavigation) {
    if (isAdminNavItemActive(item, pathname)) {
      if (pathname === item.href) {
        return { title: t(item.labelKey), subtitle: t("admin.nav.console") };
      }
      const section = SECTION_PREFIXES.find(
        (entry) =>
          pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`),
      );
      return {
        title: titleFromPathSegment(pathname),
        subtitle: section ? t(section.labelKey) : t(item.labelKey),
      };
    }
  }

  if (pathname === appRoutes.adminSettings) {
    return {
      title: t("admin.nav.settings"),
      subtitle: t("admin.nav.storeConfiguration"),
    };
  }

  if (pathname.startsWith(`${appRoutes.adminSettings}/`)) {
    const segment = pathname.split("/").pop() ?? "";
    if (isAdminSettingsSectionId(segment)) {
      const section = getAdminSettingsSection(segment);
      return {
        title: section ? t(section.labelKey) : titleFromPathSegment(pathname),
        subtitle: t("admin.nav.settings"),
      };
    }
  }

  return {
    title: t("admin.nav.console"),
    subtitle: t("admin.nav.storeOverview"),
  };
}

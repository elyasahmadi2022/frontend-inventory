/* eslint-disable react-hooks/preserve-manual-memoization */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createElement, useMemo } from "react";
import TooltipComponent from "@/context/TooltipContext";
import { useAuth } from "@/hooks/use-auth";
import { resolveUploadAssetUrl } from "@/lib/asset-url";
import { useI18n } from "@/lib/i18n";
import { useStoreSettingsQuery } from "@/lib/query/hooks";
import {
  adminNavigation,
  isAdminNavItemActive,
  type AdminNavItem,
} from "@/lib/admin/admin-navigation";
import { appRoutes } from "@/routes/app-routes";
import { SiteAccountMenu } from "../site-account-menu";
import { AdminAccountMenuContent } from "../account-menu/admin-account-menu-content";
import Image from "next/image";
import { BiSolidLeftArrowAlt, BiSolidRightArrowAlt } from "react-icons/bi";

type AdminSidebarProps = {
  isMobile: boolean;
  collapsed: boolean;
  mobileMenuOpen: boolean;
  handleSidebarToggle: () => void;
};

const sidebarIconButtonClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-none border border-light-border bg-light-bg text-light-muted transition-colors hover:border-primary-500 hover:bg-primary-50 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 dark:border-dark-border dark:bg-dark-bg dark:text-dark-muted dark:hover:border-primary-500 dark:hover:bg-primary-500/10 dark:hover:text-primary-500 sm:size-10";

function NavIcon({
  Icon,
  active,
}: {
  Icon: AdminNavItem["icon"];
  active: boolean;
}) {
  return createElement(Icon, {
    strokeWidth: active ? 2 : 1.5,
    className: `size-4 shrink-0 ${active
        ? "text-white"
        : "text-light-muted group-hover:text-light-text dark:text-dark-muted dark:group-hover:text-dark-text"
      }`,
    "aria-hidden": true,
  });
}

export function AdminSidebar({
  isMobile,
  collapsed,
  mobileMenuOpen,
  handleSidebarToggle,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { user, status } = useAuth();
  const settingsQuery = useStoreSettingsQuery();
  const settings = settingsQuery.data;
  const logoUrl = resolveUploadAssetUrl(settings?.logoUrl, "other");
  const accountUser = status === "loading" ? undefined : user;
  const permissions = new Set(user?.permissions ?? []);
  const can = (permission: string) => user?.role === "admin" || permissions.has(permission);
  const drawerExpanded = Boolean(isMobile && mobileMenuOpen);
  const railMode = collapsed && !drawerExpanded;
  const navShowsLabels = !railMode;
  const sidebarWidthClass = railMode
    ? "w-16 min-w-16"
    : "w-[min(20rem,calc(100vw-2rem))] min-w-[14rem] sm:w-65 sm:min-w-65";

  const linkClass = (active: boolean) =>
    `group relative mb-0.5 flex w-full cursor-pointer items-center gap-2.25 rounded-none border-none text-left text-xs no-underline transition-all duration-150 hover:bg-light-bg dark:hover:bg-dark-bg ${active ? "bg-primary-500 font-bold text-white hover:bg-primary-500" : "font-normal"
    } ${railMode ? "justify-center p-2.25" : "justify-start px-2.5 py-2.25"}`;

  const navContent = useMemo(
    () =>
      adminNavigation.map((item) => {
        if (item.requiredPermission && !can(item.requiredPermission)) {
          return null;
        }
        const active = isAdminNavItemActive(item, pathname);
        const label = t(item.labelKey);
        const link = (
          <Link href={item.href} className={linkClass(active)}>
            <NavIcon Icon={item.icon} active={active} />
            {navShowsLabels ? (
              <span
                className={
                  active
                    ? "text-white"
                    : "text-light-text group-hover:text-light-text dark:text-dark-text dark:group-hover:text-dark-text"
                }
              >
                {label}
              </span>
            ) : null}
          </Link>
        );

        return (
          <div key={item.key} className="mb-0.5">
            {railMode ? (
              <TooltipComponent content={label} side="right" sideOffset={8}>
                {link}
              </TooltipComponent>
            ) : (
              link
            )}
          </div>
        );
      }),
    [can, navShowsLabels, pathname, railMode, t],
  );

  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col overflow-hidden border-light-border bg-light-surface transition-[width,min-width] duration-100 ease-out dark:border-dark-border dark:bg-dark-surface ltr:border-r rtl:border-l ${isMobile ? "border-none" : ""} ${sidebarWidthClass}`}
    >
      <div
        className={`flex min-h-12 shrink-0 items-center border-b border-light-border px-2.5 py-2 dark:border-dark-border ${railMode ? "justify-center px-2" : "justify-between gap-2 rtl:flex-row-reverse"}`}
      >
        {navShowsLabels ? (
          <Link
            href={appRoutes.adminDashboard}
            className="group inline-flex min-w-0 items-center gap-2 transition hover:opacity-90"
            
          >
            {logoUrl ? (
              <div className="flex items-center gap-1">
                <span>{settings?.storeName ?? "Store Management"}</span>
                <Image
                  src={logoUrl}
                  width={36}
                  height={36}
                  alt=""
                  className="h-9 w-9 shrink-0 border border-light-border object-cover dark:border-dark-border sm:h-10 sm:w-10"
                />
              </div>
            ) : (
              <div></div>
            )}
          </Link>
        ) : null}
        <button
          type="button"
          onClick={handleSidebarToggle}
          aria-label={railMode ? t("sidebar.expand") : t("sidebar.collapse")}
          aria-expanded={!railMode}
          className={sidebarIconButtonClass}
        >
          <span className="text-current">
            {railMode ? (
              <BiSolidLeftArrowAlt color="currentColor" />
            ) : (
              <BiSolidRightArrowAlt color="currentColor" />
            )}
          </span>
        </button>
      </div>

      <nav
        style={{ padding: railMode ? "10px 8px" : "10px 10px" }}
        className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
      >
        {navContent}
      </nav>

      <div
        className={`mt-auto shrink-0 border-t border-light-border dark:border-dark-border ${railMode
            ? "flex items-center justify-center px-2 py-3"
            : "px-2.5 pb-3 pt-3"
          }`}
      >
        <SiteAccountMenu
          user={accountUser}
          variant="sidebar"
          collapsed={railMode}
          align={railMode ? "center" : "start"}
          className={railMode ? "flex w-full items-center justify-center" : "w-full"}
        >
          {user ? <AdminAccountMenuContent user={user} /> : null}
        </SiteAccountMenu>
      </div>
    </aside>
  );
}

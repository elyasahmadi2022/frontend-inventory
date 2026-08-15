"use client";

import { useSidebar } from "@/context/LayoutContext";
import TooltipComponent from "@/context/TooltipContext";
import { useAuth } from "@/hooks/use-auth";
import { resolveUploadAssetUrl } from "@/lib/asset-url";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { useStoreSettingsQuery } from "@/lib/query/hooks";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createElement, ElementType } from "react";

import { BiSolidLeftArrowAlt, BiSolidRightArrowAlt } from "react-icons/bi";
import { DashboardAccountMenuContent } from "./account-menu/dashboard-account-menu-content";
import { SiteAccountMenu } from "./site-account-menu";
import Image from "next/image";

export type NavItemType = {
  key: string;
  labelKey: TranslationKey;
  Icon: ElementType;
  path: string;
  matchPrefix?: boolean;
};

type NavItemTypes = NavItemType[];

interface SidebarType {
  isMobile: boolean;
  collapsed: boolean;
  mobileMenuOpen: boolean;
  handleSidebarToggle: () => void;
  navItems: NavItemTypes;
}

interface NavPropType {
  IconComponent: ElementType;
  active: boolean;
}

const sidebarIconButtonClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-none border border-light-border bg-light-bg text-light-muted transition-colors hover:border-primary-500 hover:bg-primary-50 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 dark:border-dark-border dark:bg-dark-bg dark:text-dark-muted dark:hover:border-primary-500 dark:hover:bg-primary-500/10 dark:hover:text-primary-500 sm:size-10";

function NavGlyph({ IconComponent, active }: NavPropType) {
  return createElement(IconComponent, {
    strokeWidth: active ? 2 : 1.5,
    className: `size-4 shrink-0 transition-all ${active
        ? "text-white"
        : "text-light-muted group-hover:text-light-text dark:text-dark-muted dark:group-hover:text-dark-text"
      }`,
    "aria-hidden": true,
  });
}

export const Sidebar = ({
  isMobile,
  mobileMenuOpen,
  collapsed,
  handleSidebarToggle,
  navItems,
}: SidebarType) => {
  const pathname = usePathname();
  const drawerExpanded = Boolean(isMobile && mobileMenuOpen);
  const railMode = collapsed && !drawerExpanded;
  const sidebarWidthClass = railMode
    ? "w-16 min-w-16"
    : "w-[min(20rem,calc(100vw-2rem))] min-w-[14rem] sm:w-65 sm:min-w-65";
  const navShowsLabels = !railMode;
  const { user, status } = useAuth();
  const accountUser = status === "loading" ? undefined : user;
  const { t } = useI18n();
  const settingsQuery = useStoreSettingsQuery();
  const settings = settingsQuery.data;
  const logoUrl = resolveUploadAssetUrl(settings?.logoUrl, "other");
  const { setMobileMenuOpen } = useSidebar();
  const closeMobileMenu = () => {
    if (isMobile) setMobileMenuOpen(false);
  };

  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col overflow-hidden border-light-border bg-light-surface transition-[width,min-width] duration-100 ease-out dark:border-dark-border dark:bg-dark-surface ltr:border-r rtl:border-l ${isMobile ? "border-none" : ""} ${sidebarWidthClass}`}
    >
      <div
        className={`flex min-h-12 shrink-0 items-center border-b border-light-border px-2.5 py-2 dark:border-dark-border ${railMode ? "justify-center px-2" : "justify-between gap-2 rtl:flex-row-reverse"}`}
      >
        {navShowsLabels ? (
          <Link
            href={"/"}
            onClick={closeMobileMenu}
            className="group inline-flex min-w-0 items-center gap-2 transition hover:opacity-90"
            
          >
            {logoUrl && (
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
        style={{
          padding: railMode ? "10px 8px" : "10px 10px",
        }}
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
      >
        {navItems.map((item) => {
          const active = item.matchPrefix
            ? pathname === item.path || pathname.startsWith(`${item.path}/`)
            : item.path === pathname;
          const label = t(item.labelKey);

          const link = (
            <Link
              href={item.path}
              onClick={closeMobileMenu}
              className={`group relative mb-0.5 flex w-full cursor-pointer items-center gap-2.25 rounded-none border-none text-left text-xs no-underline transition-all duration-150  ${active ? "bg-primary-500 font-bold text-white hover:text-light-text hover:bg-primary-500" : "font-normal hover:bg-light-bg dark:hover:bg-dark-bg"} ${railMode ? "justify-center p-2.25" : "justify-start px-2.5 py-2.25"}`}
            >
              <span className="relative inline-flex shrink-0 items-center justify-center">
                <NavGlyph IconComponent={item.Icon} active={active} />
              </span>
              {navShowsLabels ? (
                <span
                  className={
                    active
                      ? "text-white "
                      : " group-hover:text-light-text dark:text-dark-text dark:group-hover:text-dark-text"
                  }
                >
                  {label}
                </span>
              ) : null}
            </Link>
          );

          return (
            <div key={item.key} className="contents">
              {railMode && !isMobile ? (
                <TooltipComponent content={label} side="right" sideOffset={8}>
                  {link}
                </TooltipComponent>
              ) : (
                link
              )}
            </div>
          );
        })}
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
          className={
            railMode ? "flex w-full items-center justify-center" : "w-full"
          }
        >
          {user ? <DashboardAccountMenuContent user={user} /> : null}
        </SiteAccountMenu>
      </div>
    </aside>
  );
};

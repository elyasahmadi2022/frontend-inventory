"use client";

import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/LayoutContext";
import { useI18n } from "@/lib/i18n";
import { AdminTopBar } from "../admin/admin-top-bar";
import { AdminSidebar } from "../admin/admin-sidebar";
import { appRoutes } from "@/routes/app-routes";

type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}>;

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const { t } = useI18n();
  const {
    isMobile,
    mobileMenuOpen,
    setMobileMenuOpen,
    collapsed,
    handleSidebarToggle,
  } = useSidebar();

  const pathname = usePathname();
  const isSettingsRoute =
    pathname === appRoutes.adminSettings ||
    pathname.startsWith(`${appRoutes.adminSettings}/`);

  return (
    <div className="mx-auto flex h-screen w-full max-w-384 bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text">
      {isMobile && mobileMenuOpen ? (
        <button
          type="button"
          aria-label={t("admin.header.closeMenu")}
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
          <AdminSidebar
            handleSidebarToggle={handleSidebarToggle}
            mobileMenuOpen={mobileMenuOpen}
            isMobile={isMobile}
            collapsed={collapsed}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AdminTopBar
            title={title}
            subtitle={subtitle}
            onMenuClick={handleSidebarToggle}
          />
          <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-1 md:p-2">
            {isSettingsRoute ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {children}
              </div>
            ) : (
              <div className="scrollbar-gutter-stable min-h-0 flex-1 overflow-y-auto scrollbar-thin">
                {children}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

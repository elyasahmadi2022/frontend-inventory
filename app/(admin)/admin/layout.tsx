"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { RequireAuth } from "@/components/auth/require-auth";
import { appRoutes } from "@/routes/app-routes";
import { LayoutProvider } from "@/context/LayoutContext";
import { AdminLayout as AdminShell } from "@/components/layout/admin-layout";
import { getAdminHeaderForPath } from "@/lib/admin/admin-navigation";
import { useI18n } from "@/lib/i18n";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const isLogin = pathname === appRoutes.adminLogin;
  const header = useMemo(() => {
    if (pathname === appRoutes.adminDashboard) {
      return {
        title: t("admin.header.dashboard.title"),
        subtitle: t("admin.header.dashboard.subtitle"),
      };
    }
    if (pathname === "/admin") {
      return {
        title: t("admin.header.dashboard.title"),
        subtitle: t("admin.header.redirecting"),
      };
    }
    const fromNav = getAdminHeaderForPath(pathname, t);
    return fromNav;
  }, [pathname, t]);

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <RequireAuth allowedRoles={["admin"]} loginRoute={appRoutes.adminLogin}>
      <LayoutProvider>
        <AdminShell title={header.title} subtitle={header.subtitle}>
          {children}
        </AdminShell>
      </LayoutProvider>
    </RequireAuth>
  );
}

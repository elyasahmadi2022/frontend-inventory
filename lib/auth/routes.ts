import type { AuthRole } from "@/lib/auth/roles";
import { appRoutes } from "@/routes/app-routes";

export function getLoginRouteForRole(role: AuthRole | null): string {
  return role === "admin" ? appRoutes.adminLogin : appRoutes.login;
}

export function getHomeRouteForRole(role: AuthRole | null): string {
  if (role === "admin") return appRoutes.adminDashboard;
  return appRoutes.dashboard;
}

export function getRequiredRolesForPath(pathname: string): AuthRole[] | null {
  if (pathname === appRoutes.adminLogin || pathname === appRoutes.login) {
    return null;
  }

  if (pathname.startsWith("/admin")) {
    return ["admin"];
  }

  if (pathname.startsWith("/dashboard")) {
    return ["manager", "user"];
  }

  return null;
}

export function canAccessPath(
  pathname: string,
  role: AuthRole | null,
  isAuthenticated: boolean,
): boolean {
  const required = getRequiredRolesForPath(pathname);
  if (!required) return true;
  if (!isAuthenticated || !role) return false;
  return required.includes(role);
}

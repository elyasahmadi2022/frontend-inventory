"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getHomeRouteForRole, getLoginRouteForRole } from "@/lib/auth/routes";
import type { AuthRole } from "@/lib/auth/roles";

type RequireAuthProps = {
  children: ReactNode;
  /** Roles allowed to view this route. Omit to require any authenticated user. */
  allowedRoles?: AuthRole[];
  /** Where to send unauthenticated visitors. */
  loginRoute?: string;
  /** Optional loading UI while the session hydrates. */
  fallback?: ReactNode;
};

const defaultFallback = (
  <div className="flex min-h-[40vh] items-center justify-center p-8">
    <div className="h-8 w-48 animate-pulse rounded-none bg-light-border dark:bg-dark-border" />
  </div>
);

export function RequireAuth({
  children,
  allowedRoles,
  loginRoute,
  fallback = defaultFallback,
}: RequireAuthProps) {
  const router = useRouter();
  const { status, isAuthenticated, role, hasRole } = useAuth();

  const resolvedLoginRoute = loginRoute ?? getLoginRouteForRole(role);

  useEffect(() => {
    if (status === "loading") return;

    if (!isAuthenticated) {
      router.replace(resolvedLoginRoute);
      return;
    }

    if (allowedRoles && role && !hasRole(...allowedRoles)) {
      router.replace(getHomeRouteForRole(role));
      return;
    }
  }, [
    allowedRoles,
    hasRole,
    isAuthenticated,
    resolvedLoginRoute,
    role,
    router,
    status,
  ]);

  if (status === "loading") {
    return fallback;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles?.length && role && !hasRole(...allowedRoles)) {
    return null;
  }

  return children;
}

type GuestOnlyProps = {
  children: ReactNode;
  fallback?: ReactNode;
  /** Override post-login destination (e.g. admin console). */
  redirectTo?: string;
};

const redirectingFallback = (
  <div className="flex min-h-screen items-center justify-center bg-light-bg p-8 dark:bg-dark-bg">
    <div className="h-8 w-48 animate-pulse rounded-none bg-light-border dark:bg-dark-border" />
  </div>
);

/** Redirect signed-in users away from login screens. */
export function GuestOnly({
  children,
  fallback = defaultFallback,
  redirectTo,
}: GuestOnlyProps) {
  const { status, isAuthenticated, role } = useAuth();

  useEffect(() => {
    if (status === "loading" || !isAuthenticated) return;

    const destination = redirectTo ?? getHomeRouteForRole(role);
    window.location.assign(destination);
  }, [isAuthenticated, redirectTo, role, status]);

  if (status === "loading") {
    return fallback;
  }

  if (isAuthenticated) {
    return redirectingFallback;
  }

  return children;
}

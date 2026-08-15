import type { AuthUser } from "@/services/auth.service";

/** Canonical roles returned by the API (normalized to lowercase). */
export type AuthRole = "admin" | "manager" | "user";

const ROLE_ALIASES: Record<string, AuthRole> = {
  admin: "admin",
  administrator: "admin",
  manager: "manager",
  staff: "user",
  user: "user",
};

export function normalizeAuthRole(
  role: string | null | undefined,
): AuthRole | null {
  const key = String(role ?? "")
    .toLowerCase()
    .trim();
  if (!key) return null;
  return ROLE_ALIASES[key] ?? null;
}

export function getUserRole(
  user: Pick<AuthUser, "role"> | null | undefined,
): AuthRole | null {
  return normalizeAuthRole(user?.role);
}

export function isAdminUser(
  user: Pick<AuthUser, "role"> | null | undefined,
): boolean {
  return getUserRole(user) === "admin";
}


//need to change this 
export function isOwnerUser(
  user: Pick<AuthUser, "role"> | null | undefined,
): boolean {
  return getUserRole(user) === "manager";
}

export function isAuthenticatedUser(
  user: Pick<AuthUser, "id" | "email"> | null | undefined,
): boolean {
  return Boolean(user?.id || user?.email);
}

export function userHasRole(
  user: Pick<AuthUser, "role"> | null | undefined,
  ...roles: AuthRole[]
): boolean {
  const role = getUserRole(user);
  return role !== null && roles.includes(role);
}

"use client";

import { setApiAuthToken } from "@/lib/api";
import { clearPersonalizedDataOnLogout } from "@/lib/personalized-storage";
import type { AuthUser } from "@/services/auth.service";

export const AUTH_TOKEN_KEY = "srs_token";
export const AUTH_REFRESH_TOKEN_KEY = "srs_refresh_token";
export const AUTH_USER_KEY = "srs_user";
export const AUTH_SESSION_CHANGED_EVENT = "srs:auth-session-changed";

export type StoredAuthSession = {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
};

function notifyAuthSessionChanged(): void {
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

function readStoredUser(raw: string | null): AuthUser | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as AuthUser;
    }
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
  }

  return null;
}

export function getStoredAuthSession(): StoredAuthSession {
  if (typeof window === "undefined") {
    return { token: null, refreshToken: null, user: null };
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const refreshToken = localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
  const user = readStoredUser(localStorage.getItem(AUTH_USER_KEY));
  return { token, refreshToken, user };
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
}

export function resolveLoginToken(
  token?: string | null,
  accessToken?: string | null,
): string | null {
  return token ?? accessToken ?? null;
}

export function updateAuthTokens(
  accessToken: string | null,
  refreshToken?: string | null,
): void {
  if (typeof window === "undefined") return;

  if (accessToken) {
    localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  if (refreshToken) {
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
  }

  setApiAuthToken(accessToken);
  notifyAuthSessionChanged();
}

export function saveAuthSession(
  token: string | null,
  user: AuthUser,
  refreshToken?: string | null,
): void {
  if (typeof window === "undefined") return;

  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  if (refreshToken) {
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
  }

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  setApiAuthToken(token);
  notifyAuthSessionChanged();
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;

  clearPersonalizedDataOnLogout();
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  setApiAuthToken(null);
  notifyAuthSessionChanged();
}

export function hydrateApiAuthFromStorage(): StoredAuthSession {
  const session = getStoredAuthSession();
  setApiAuthToken(session.token);
  return session;
}

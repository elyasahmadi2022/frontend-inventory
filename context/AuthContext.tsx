"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, setAuthFailureHandler } from "@/lib/api";
import {
  getUserRole,
  isAuthenticatedUser,
  userHasRole,
  type AuthRole,
} from "@/lib/auth/roles";
import { getHomeRouteForRole, getLoginRouteForRole } from "@/lib/auth/routes";
import { appRoutes } from "@/routes/app-routes";
import {
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_SESSION_CHANGED_EVENT,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  clearAuthSession,
  getStoredAuthSession,
  hydrateApiAuthFromStorage,
  resolveLoginToken,
  saveAuthSession,
} from "@/services/auth-session";
import {
  getCurrentUser,
  logout,
  signIn,
  signInWithGoogle,
  type AuthUser,
  type LoginRequest,
  type SignInOptions,
  type SignInResult,
} from "@/services/auth.service";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  role: AuthRole | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  hasRole: (...roles: AuthRole[]) => boolean;
  signIn: (credentials: LoginRequest, options?: SignInOptions) => Promise<SignInResult>;
  signInWithGoogle: (
    payload: { accessToken?: string; credential?: string },
    options?: { role?: "user" | "owner" },
  ) => Promise<SignInResult>;
  signOut: (options?: { redirectTo?: string }) => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

function getInitialAuthSession() {
  return {
    token: null,
    user: null,
    refreshToken: null,
    status: "loading" as const,
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [initialSession] = useState(getInitialAuthSession);
  const [user, setUser] = useState<AuthUser | null>(initialSession.user);
  const [token, setToken] = useState<string | null>(initialSession.token);
  const [status, setStatus] = useState<AuthStatus>(initialSession.status);

  const role = useMemo(() => getUserRole(user), [user]);
  const isAuthenticated =
    status === "authenticated" &&
    (isAuthenticatedUser(user) || Boolean(token));

  const applySession = useCallback((nextToken: string | null, nextUser: AuthUser | null) => {
    setToken(nextToken);
    setUser(nextUser);

    if (isAuthenticatedUser(nextUser) || nextToken) {
      setStatus("authenticated");
      return;
    }

    setStatus("unauthenticated");
  }, []);

  const syncFromStorage = useCallback(() => {
    const session = hydrateApiAuthFromStorage();

    // Stored browser data is not proof of a valid server session. Keep protected
    // routes behind their loading state until `/auth/me` validates the token.
    if (!session.token) {
      applySession(null, null);
      return session;
    }

    setToken(session.token);
    setUser(null);
    setStatus("loading");
    return session;
  }, [applySession]);

  const refreshUser = useCallback(async () => {
    const session = getStoredAuthSession();
    if (!session.token && !session.user && !session.refreshToken) {
      applySession(null, null);
      return null;
    }

    hydrateApiAuthFromStorage();

    try {
      const currentUser = await getCurrentUser();
      const freshSession = getStoredAuthSession();
      saveAuthSession(freshSession.token, currentUser, freshSession.refreshToken);
      applySession(freshSession.token, currentUser);
      return currentUser;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAuthSession();
        applySession(null, null);
        return null;
      }
      applySession(session.token, session.user);
      return null;
    }
  }, [applySession]);

  const handleSignIn = useCallback(
    async (credentials: LoginRequest, options?: SignInOptions) => {
      const result = await signIn(credentials, options);
      const resolvedToken = resolveLoginToken(result.token, result.accessToken);
      saveAuthSession(resolvedToken, result.user, result.refreshToken);
      applySession(resolvedToken, result.user);

      let activeUser = result.user;
      try {
        const refreshedUser = await getCurrentUser({ suppressAuthFailure: true });
        if (refreshedUser) {
          const freshSession = getStoredAuthSession();
          saveAuthSession(
            freshSession.token ?? resolvedToken,
            refreshedUser,
            freshSession.refreshToken ?? result.refreshToken,
          );
          applySession(freshSession.token ?? resolvedToken, refreshedUser);
          activeUser = refreshedUser;
        }
      } catch {
        // Keep the login session when profile refresh is temporarily unavailable.
      }

      const role = getUserRole(activeUser) ?? getUserRole(result.user);
      const redirectTo =
        options?.requireRole === "admin"
          ? appRoutes.adminDashboard
          : getHomeRouteForRole(role);

      return {
        ...result,
        user: activeUser,
        role,
        redirectTo,
      };
    },
    [applySession],
  );

  const handleGoogleSignIn = useCallback(
    async (
      payload: { accessToken?: string; credential?: string },
      options?: { role?: "user" | "owner" },
    ) => {
      const result = await signInWithGoogle({
        ...payload,
        role: options?.role,
      });
      const resolvedToken = resolveLoginToken(result.token, result.accessToken);
      applySession(resolvedToken, result.user);

      let activeUser = result.user;
      try {
        const refreshedUser = await getCurrentUser({ suppressAuthFailure: true });
        if (refreshedUser) {
          const freshSession = getStoredAuthSession();
          saveAuthSession(
            freshSession.token ?? resolvedToken,
            refreshedUser,
            freshSession.refreshToken ?? result.refreshToken,
          );
          applySession(freshSession.token ?? resolvedToken, refreshedUser);
          activeUser = refreshedUser;
        }
      } catch {
        // Keep the Google session when profile refresh is temporarily unavailable.
      }

      const role = getUserRole(activeUser) ?? getUserRole(result.user);

      return {
        ...result,
        user: activeUser,
        role,
        redirectTo: getHomeRouteForRole(role),
      };
    },
    [applySession],
  );

  const handleSignOut = useCallback(
    async (options?: { redirectTo?: string }) => {
      const currentRole = getUserRole(user);
      const redirectTo = options?.redirectTo ?? getLoginRouteForRole(currentRole);

      try {
        await logout();
      } catch {
        // Always clear local session even when the API is unavailable.
      }

      clearAuthSession();
      applySession(null, null);

      if (typeof window !== "undefined") {
        window.location.assign(redirectTo);
      }
    },
    [applySession, user],
  );

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        syncFromStorage();
        void refreshUser();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refreshUser, syncFromStorage]);

  useEffect(() => {
    function handleSessionChanged() {
      syncFromStorage();
    }

    function handleStorage(event: StorageEvent) {
      if (
        event.key === AUTH_TOKEN_KEY ||
        event.key === AUTH_REFRESH_TOKEN_KEY ||
        event.key === AUTH_USER_KEY
      ) {
        syncFromStorage();
        void refreshUser();
      }
    }

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChanged);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshUser, syncFromStorage]);

  useEffect(() => {
    setAuthFailureHandler(() => {
      clearAuthSession();
      applySession(null, null);
    });

    return () => {
      setAuthFailureHandler(null);
    };
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      role,
      status,
      isAuthenticated,
      hasRole: (...roles: AuthRole[]) => userHasRole(user, ...roles),
      signIn: handleSignIn,
      signInWithGoogle: handleGoogleSignIn,
      signOut: handleSignOut,
      refreshUser,
    }),
    [
      user,
      token,
      role,
      status,
      isAuthenticated,
      handleSignIn,
      handleGoogleSignIn,
      handleSignOut,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}

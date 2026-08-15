/**
 * API base URL. Browser requests intentionally stay same-origin so Next.js
 * rewrites can proxy `/api/*` to the backend without browser CORS.
 */
const BACKEND_STATUS_CHANGED_EVENT = "srs:backend-status-changed";

type BackendStatus = {
  unavailable: boolean;
  message: string | null;
  checkedAt: number | null;
};

const backendStatus: BackendStatus = {
  unavailable: false,
  message: null,
  checkedAt: null,
};

const backendStatusListeners = new Set<() => void>();

function emitBackendStatusChanged() {
  for (const listener of backendStatusListeners) listener();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(BACKEND_STATUS_CHANGED_EVENT));
  }
}

function setBackendStatus(next: BackendStatus) {
  if (
    backendStatus.unavailable === next.unavailable &&
    backendStatus.message === next.message &&
    backendStatus.checkedAt === next.checkedAt
  ) {
    return;
  }

  backendStatus.unavailable = next.unavailable;
  backendStatus.message = next.message;
  backendStatus.checkedAt = next.checkedAt;
  emitBackendStatusChanged();
}

export function markBackendUnavailable(message: string) {
  setBackendStatus({
    unavailable: true,
    message,
    checkedAt: Date.now(),
  });
}

export function clearBackendUnavailable() {
  setBackendStatus({
    unavailable: false,
    message: null,
    checkedAt: Date.now(),
  });
}

export function getBackendStatus() {
  return backendStatus;
}

export function subscribeToBackendStatus(listener: () => void) {
  backendStatusListeners.add(listener);
  return () => backendStatusListeners.delete(listener);
}

function resolveServerApiBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const proxyTarget = process.env.API_PROXY_TARGET?.trim().replace(/\/$/, "");
  if (proxyTarget) return proxyTarget;
  return "http://localhost:4000";
}

/**
 * Browser: same-origin `/api/*` uses Next.js rewrites to reach the backend.
 * Server: needs an absolute URL, so it falls back to API_PROXY_TARGET / localhost.
 */
export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return resolveServerApiBaseUrl();
  }
  return "";
}

let authToken: string | null = null;
let authFailureHandler: (() => void) | null = null;

/** Call when you implement auth to attach `Authorization: Bearer ...` on requests. */
export function setApiAuthToken(token: string | null): void {
  authToken = token;
}

/** Registered by AuthProvider to clear invalid sessions on 401 API responses. */
export function setAuthFailureHandler(handler: (() => void) | null): void {
  authFailureHandler = handler;
}

export function getApiAuthToken(): string | null {
  return authToken;
}

export type ApiRequestInit = RequestInit & {
  /** When true, do not add Authorization (e.g. login/register). */
  skipAuth?: boolean;
  /** When true, do not run the global auth-failure handler on a 401 response. */
  suppressAuthFailure?: boolean;
};

export type ApiErrorPayload = {
  code?: string;
  message?: string;
  [key: string]: unknown;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  payload?: ApiErrorPayload | string;

  constructor(
    message: string,
    options: {
      status: number;
      code?: string;
      payload?: ApiErrorPayload | string;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.payload = options.payload;
  }
}

function joinUrl(base: string, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) return p;
  return `${base}${p}`;
}

function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json");
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  if (isJsonResponse(response)) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
}

/** Build a short user-facing message; avoids dumping HTML error pages into toasts. */
function messageFromErrorPayload(
  payload: unknown,
  status: number,
  response: Response,
): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof (payload as ApiErrorPayload).message === "string"
  ) {
    return (
      (payload as ApiErrorPayload).message ??
      `Request failed with status ${status}`
    );
  }

  if (typeof payload === "string" && payload.length > 0) {
    const trimmed = payload.trim();
    if (/^<!DOCTYPE/i.test(trimmed) || /^<html/i.test(trimmed)) {
      return `HTTP ${status}: ${response.statusText || "Error"} — this URL is not a JSON API route (check path and method).`;
    }
    const cannot = trimmed.match(/Cannot\s+(GET|POST|PATCH|PUT|DELETE)\s+\S+/i);
    if (cannot?.[0]) {
      return cannot[0];
    }
    if (trimmed.length > 280) {
      return `Request failed with status ${status}`;
    }
    return trimmed;
  }

  return `Request failed with status ${status}`;
}

/**
 * Fetch against the configured API. Browser requests use same-origin relative paths.
 * Defaults to `credentials: "include"` so httpOnly auth cookies are sent on browser requests.
 */
export async function apiFetch(
  path: string,
  init: ApiRequestInit = {},
): Promise<Response> {
  const base = getApiBaseUrl();
  const url =
    path.startsWith("http://") || path.startsWith("https://")
      ? path
      : joinUrl(base, path);

  const { skipAuth, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);

  if (!skipAuth && authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  try {
    return await fetch(url, {
      ...rest,
      credentials: rest.credentials ?? "include",
      headers,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The backend is unavailable right now.";
    markBackendUnavailable(message);
    throw new ApiError(message, {
      status: 503,
      code: "BACKEND_UNAVAILABLE",
      payload: typeof message === "string" ? message : undefined,
    });
  }
}

/**
 * Request helper with consistent JSON/text parsing and error shape.
 * Throws ApiError on non-2xx responses.
 */
export async function apiRequest<T = unknown>(
  path: string,
  init: ApiRequestInit = {},
): Promise<T> {
  const response = await apiFetch(path, init);
  const payload = await parseResponseBody(response);

  if (!response.ok) {
    const message = messageFromErrorPayload(payload, response.status, response);

    if ([502, 503, 504].includes(response.status)) {
      markBackendUnavailable(message);
    }

    if (
      !init.skipAuth &&
      !init.suppressAuthFailure &&
      response.status === 401 &&
      authToken &&
      authFailureHandler
    ) {
      authFailureHandler();
    }

    const code =
      typeof payload === "object" &&
      payload !== null &&
      "code" in payload &&
      typeof payload.code === "string"
        ? payload.code
        : undefined;

    throw new ApiError(message, {
      status: response.status,
      code,
      payload:
        typeof payload === "object" && payload !== null
          ? (payload as ApiErrorPayload)
          : typeof payload === "string"
            ? payload
            : undefined,
    });
  }

  clearBackendUnavailable();
  return payload as T;
}

/**
 * JSON request helper to reduce repetition for register/login/profile APIs.
 */
export async function apiJson<
  TResponse,
  TBody extends Record<string, unknown> = Record<string, unknown>,
>(
  path: string,
  body: TBody,
  init: Omit<ApiRequestInit, "body" | "method"> & {
    method?: "POST" | "PATCH" | "PUT" | "DELETE";
  } = {},
): Promise<TResponse> {
  const { method = "POST", headers, ...rest } = init;
  const nextHeaders = new Headers(headers);
  nextHeaders.set("Content-Type", "application/json");

  return apiRequest<TResponse>(path, {
    ...rest,
    method,
    headers: nextHeaders,
    body: JSON.stringify(body),
  });
}

export type ApiHealthResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

/**
 * Server-only friendly health check (no client loading state). Skips browser CORS.
 */
export async function fetchApiHealth(): Promise<ApiHealthResult> {
  const base = getApiBaseUrl();
  if (!base) {
    return {
      ok: false,
      message:
        "NEXT_PUBLIC_API_URL is not set. Copy .env.example to .env.local and set your API base URL.",
    };
  }

  try {
    const res = await fetch(`${base}/health`, {
      cache: "no-store",
      credentials: "include",
    });
    const text = await res.text();
    if (!res.ok) {
      markBackendUnavailable(`HTTP ${res.status}: ${text || res.statusText}`);
      return {
        ok: false,
        message: `HTTP ${res.status}: ${text || res.statusText}`,
      };
    }
    clearBackendUnavailable();
    return { ok: true, message: text.trim() || "OK" };
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : "Request failed (is the API running and reachable from this machine?)";
    markBackendUnavailable(message);
    return {
      ok: false,
      message,
    };
  }
}

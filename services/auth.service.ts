import type { AuthRole } from "@/lib/auth/roles";
import {
  getUserRole,
  isAdminUser,
  isOwnerUser,
  normalizeAuthRole,
  userHasRole,
} from "@/lib/auth/roles";
import { getHomeRouteForRole } from "@/lib/auth/routes";
import { appRoutes } from "@/routes/app-routes";
import { ApiError, apiFetch, apiJson, apiRequest } from "@/lib/api";
import {
  getStoredRefreshToken,
  resolveLoginToken,
  saveAuthSession,
} from "@/services/auth-session";

export {
  getUserRole,
  isAdminUser,
  isOwnerUser,
  normalizeAuthRole,
  userHasRole,
};
export type { AuthRole };

type ApiEnvelope<TData> = {
  success: boolean;
  message: string;
  status: number;
  data?: TData;
};

export type AuthUser = {
  id?: string | number;
  code?: string | null;
  username?: string;
  name?: string;
  fullName?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  /** Owner bio when backend includes it on `/auth/me`. */
  bio?: string | null;
  role?: string;
  roles?: string[];
  permissions?: string[];
  status?: string;
  profileImageUrl?: string | null;
  isEmailVerified?: boolean;
  verification_status?: "pending_verification" | "verified" | "rejected";
  /** Admin verification comment (often shown when rejected). */
  owner_comment?: string | null;
  /** Owner profile image URL from `/auth/me`. */
  profile_image?: string | null;
  /** Owner cover image URL from `/auth/me`. */
  cover_image?: string | null;
  /** Owner Jawaz ID number when returned on `/auth/me`. */
  jawaz_number?: string | null;
  /** Owner Jawaz document image URLs when returned on `/auth/me`. */
  jawaz_images?: string[];
  /** Owner record id for public profile links. */
  owner_id?: number | null;
};

function mapVerificationStatus(
  raw: unknown,
): AuthUser["verification_status"] | undefined {
  const status = String(raw ?? "").toLowerCase().trim();
  if (status === "verified") return "verified";
  if (status === "rejected") return "rejected";
  if (status === "pending" || status === "pending_verification") {
    return "pending_verification";
  }
  return undefined;
}

function normalizeAuthUser(payload: unknown): AuthUser {
  const source =
    payload &&
    typeof payload === "object" &&
    "profile" in payload &&
    typeof (payload as { profile?: unknown }).profile === "object"
      ? (payload as { profile: Record<string, unknown> }).profile
      : (payload as Record<string, unknown> | null);

  if (!source || typeof source !== "object") return {};

  const owner =
    source.owner && typeof source.owner === "object"
      ? (source.owner as Record<string, unknown>)
      : null;

  const roles = Array.isArray(source.roles)
    ? source.roles
        .map((role) => {
          if (typeof role === "string") return role;
          if (role && typeof role === "object" && "name" in role) {
            return String((role as { name?: unknown }).name ?? "");
          }
          return "";
        })
        .filter(Boolean)
    : [];
  const primaryRole = readString(source.role) ?? roles[0];

  return {
    id: source.id as string | number | undefined,
    code: readString(source.code) ?? null,
    username: readString(source.username),
    name:
      (source.name as string | undefined) ??
      (source.fullName as string | undefined) ??
      (source.full_name as string | undefined),
    fullName: source.fullName as string | undefined,
    full_name: source.full_name as string | undefined,
    email: source.email as string | undefined,
    role: primaryRole,
    roles,
    permissions: Array.isArray(source.permissions)
      ? (source.permissions as string[])
      : [],
    status: readString(source.status),
    isEmailVerified: Boolean(source.isEmailVerified),
    phone:
      (source.phone as string | undefined) ??
      (owner?.phone as string | undefined),
    bio:
      (source.bio as string | null | undefined) ??
      (owner?.bio as string | null | undefined) ??
      null,
    verification_status:
      mapVerificationStatus(source.verification_status) ??
      mapVerificationStatus(source.status),
    owner_comment:
      (source.owner_comment as string | null | undefined) ??
      (source.comment as string | null | undefined) ??
      null,
    profile_image:
      readString(source.profileImageUrl) ??
      readString(source.profile_image) ??
      readString(source.profile) ??
      readString(owner?.profile as string | undefined) ??
      null,
    profileImageUrl:
      readString(source.profileImageUrl) ??
      readString(source.profile_image) ??
      null,
    cover_image:
      readString(source.cover_image) ??
      readString(source.cover) ??
      readString(owner?.cover as string | undefined) ??
      null,
    jawaz_number:
      readString(source.jawaz_number) ??
      readString(owner?.jawaz_number as string | undefined) ??
      null,
    jawaz_images: Array.isArray(source.jawaz_images)
      ? (source.jawaz_images as string[])
      : Array.isArray(owner?.jawaz_images)
        ? (owner.jawaz_images as string[])
        : [],
    owner_id:
      typeof source.owner_id === "number"
        ? source.owner_id
        : typeof owner?.id === "number"
          ? owner.id
          : null,
  };
}

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user: AuthUser;
};

export type SignInOptions = {
  /** When set, sign-in fails unless the API returns this role. */
  requireRole?: AuthRole;
};

export type SignInResult = LoginResponse & {
  role: AuthRole | null;
  redirectTo: string;
};

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function unwrapApiData(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const root = payload as Record<string, unknown>;
  if (root.data && typeof root.data === "object") {
    return root.data as Record<string, unknown>;
  }
  return root;
}

function normalizeLoginResponse(payload: unknown): LoginResponse {
  const data = unwrapApiData(payload);
  if (!data || typeof data !== "object") {
    return { user: {} };
  }

  const root = data;
  const profileSource =
    root.user && typeof root.user === "object"
      ? root.user
      : root.profile && typeof root.profile === "object"
        ? root.profile
        : root;

  const profileRecord =
    profileSource && typeof profileSource === "object"
      ? (profileSource as Record<string, unknown>)
      : root;

  const token = resolveLoginToken(
    readString(root.token) ??
      readString(root.accessToken) ??
      readString(root.access_token),
    readString(profileRecord.token) ??
      readString(profileRecord.accessToken) ??
      readString(profileRecord.access_token),
  );

  const refreshToken =
    readString(root.refreshToken) ??
    readString(root.refresh_token) ??
    readString(profileRecord.refreshToken) ??
    readString(profileRecord.refresh_token);

  const user = normalizeAuthUser(profileRecord);

  if (!user.id) {
    user.id = profileRecord.id as string | number | undefined;
  }
  if (!user.email) {
    user.email = readString(profileRecord.email) ?? readString(root.email);
  }
  if (!user.name) {
    user.name =
      readString(profileRecord.name) ??
      readString(profileRecord.full_name) ??
      readString(root.name);
  }
  if (!user.role) {
    user.role = readString(profileRecord.role) ?? readString(root.role);
  }

  return {
    token: token ?? undefined,
    accessToken: token ?? undefined,
    refreshToken: refreshToken ?? undefined,
    user,
  };
}

export async function signIn(
  data: LoginRequest,
  options: SignInOptions = {},
): Promise<SignInResult> {
  const result = await login(data);
  const role = getUserRole(result.user);

  if (options.requireRole && role !== options.requireRole) {
    throw new ApiError("This account does not have access to this sign-in page.", {
      status: 403,
      code: "ROLE_MISMATCH",
    });
  }

  return buildSignInResult(result, options);
}

export async function signInWithGoogle(
  data: GoogleAuthRequest,
): Promise<SignInResult> {
  const response = await apiJson<ApiEnvelope<unknown>, GoogleAuthRequest>(
    "/api/v1/auth/google",
    data,
    {
      method: "POST",
      skipAuth: true,
    },
  );

  return buildSignInResult(normalizeLoginResponse(response));
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiJson<
    | ApiEnvelope<{
      id?: string | number;
      name?: string;
      email?: string;
      role?: string;
      verification_status?: AuthUser["verification_status"];
      token?: string;
      accessToken?: string;
      refreshToken?: string;
    }>
    | {
        accessToken?: string;
        refreshToken?: string;
        user?: unknown;
        message?: string;
      },
    { identifier: string; password: string }
  >("/api/auth/login", { identifier: data.email, password: data.password }, {
    skipAuth: true,
    method: "POST",
  });

  if ("message" in response && /incorrect password/i.test(String(response.message))) {
    throw new ApiError(String(response.message), {
      status: 401,
      payload: response,
    });
  }

  return normalizeLoginResponse(response);
}

export type RegisterResponse = {
  user?: AuthUser;
  message?: string;
  email?: string;
  emailVerificationRequired?: boolean;
  otpSent?: boolean;
  otpExpiresAt?: string | null;
};

export type RegisterOwnerRequest = {
  name: string;
  email: string;
  password: string;
  phone: string;
  bio?: string;
  jawazNumber: string;
  jawazImages: File[];
  profilePhoto?: File | null;
  coverPhoto?: File | null;
};

export type RegisterUserRequest = {
  name: string;
  email: string;
  password: string;
};

export type GoogleAuthRequest = {
  credential?: string;
  accessToken?: string;
  role?: "user" | "owner";
};

function buildSignInResult(
  result: LoginResponse,
  options: SignInOptions = {},
): SignInResult {
  const role = getUserRole(result.user);
  const token = resolveLoginToken(result.token, result.accessToken);
  saveAuthSession(token, result.user, result.refreshToken);

  return {
    ...result,
    role,
    redirectTo:
      options.requireRole === "admin"
        ? appRoutes.adminDashboard
        : getHomeRouteForRole(role),
  };
}

async function parseApiEnvelope(response: Response): Promise<ApiEnvelope<unknown> | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return (await response.json()) as ApiEnvelope<unknown>;
    } catch {
      return null;
    }
  }
  try {
    const text = await response.text();
    return text ? ({ success: response.ok, message: text, status: response.status } as ApiEnvelope<unknown>) : null;
  } catch {
    return null;
  }
}

export async function registerOwner(
  data: RegisterOwnerRequest,
): Promise<RegisterResponse> {
  return registerUser({
    name: data.name,
    email: data.email,
    password: data.password,
  });
}

export async function registerUser(
  data: RegisterUserRequest,
): Promise<RegisterResponse> {
  const username = data.email
    .split("@")[0]
    ?.toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || `user_${Date.now()}`;
  const payload = {
    fullName: data.name,
    username: username.length >= 3 ? username : `${username}user`,
    email: data.email,
    password: data.password,
  };

  const response = await apiJson<
    ApiEnvelope<unknown> | { user?: unknown; accessToken?: string; refreshToken?: string; message?: string },
    typeof payload
  >(
    "/api/auth/bootstrap-admin",
    payload,
    {
      method: "POST",
      skipAuth: true,
    },
  );

  const responseData = unwrapApiData(response);

  return {
    user: normalizeAuthUser(responseData.user ?? responseData),
    message: "message" in response ? response.message : undefined,
    email: String(responseData.email ?? data.email),
    emailVerificationRequired: false,
    otpSent: false,
    otpExpiresAt: null,
  };
}

export async function getCurrentUser(
  options: { suppressAuthFailure?: boolean } = {},
): Promise<AuthUser> {
  const response = await apiRequest<ApiEnvelope<unknown> | { user?: unknown }>("/api/auth/me", {
    method: "GET",
    suppressAuthFailure: options.suppressAuthFailure,
  });

  const data = unwrapApiData(response);
  return normalizeAuthUser(data.user ?? data);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiJson<ApiEnvelope<unknown>, { email: string }>(
    "/api/auth/forgot-password",
    { email },
    { skipAuth: true, method: "POST" },
  );
}

export async function resetPasswordWithToken(payload: {
  token: string;
  newPassword: string;
}): Promise<void> {
  await apiJson<ApiEnvelope<unknown>, { token: string; password: string }>(
    "/api/auth/reset-password",
    { token: payload.token, password: payload.newPassword },
    { skipAuth: true, method: "POST" },
  );
}

export async function logout(): Promise<void> {
  await apiRequest("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken: getStoredRefreshToken() ?? undefined }),
    headers: { "Content-Type": "application/json" },
    suppressAuthFailure: true,
  });
}

export type EmailVerificationStatus = {
  pending: boolean;
  isEmailVerified: boolean;
  otpSent?: boolean;
  message?: string | null;
  expiresAt?: string | null;
  otpExpiresAt?: string | null;
};

export async function fetchEmailVerificationStatus(): Promise<EmailVerificationStatus> {
  const response = await apiRequest<
    ApiEnvelope<EmailVerificationStatus>
  >("/api/v1/auth/me/email-verification", { method: "GET" });
  return {
    pending: Boolean(response.data?.pending),
    isEmailVerified: Boolean(response.data?.isEmailVerified),
    otpSent: Boolean(response.data?.otpSent),
    message: response.data?.message ?? null,
    expiresAt: response.data?.expiresAt ?? null,
    otpExpiresAt: response.data?.otpExpiresAt ?? null,
  };
}

export async function requestEmailVerificationOtp(): Promise<{
  otpExpiresAt?: string | null;
}> {
  const response = await apiRequest<
    ApiEnvelope<{ otpExpiresAt?: string | null; otpSent?: boolean }>
  >("/api/v1/auth/me/request-email-verification-otp", { method: "POST" });
  return {
    otpExpiresAt: response.data?.otpExpiresAt ?? null,
  };
}

export async function verifyEmailWithOtp(code: string): Promise<void> {
  await apiJson<ApiEnvelope<{ isEmailVerified?: boolean }>, { code: string }>(
    "/api/v1/auth/verify-email",
    { code },
    { method: "POST" },
  );
}

export async function requestPublicEmailVerificationOtp(email: string): Promise<{
  otpExpiresAt?: string | null;
}> {
  const response = await apiJson<
    ApiEnvelope<{ otpExpiresAt?: string | null; otpSent?: boolean }>,
    { email: string }
  >(
    "/api/v1/auth/request-email-verification-otp",
    { email },
    { method: "POST", skipAuth: true },
  );
  return {
    otpExpiresAt: response.data?.otpExpiresAt ?? null,
  };
}

export async function verifyPublicEmailWithOtp(payload: {
  email: string;
  code: string;
}): Promise<void> {
  await apiJson<
    ApiEnvelope<{ isEmailVerified?: boolean }>,
    { email: string; code: string }
  >(
    "/api/v1/auth/verify-email/public",
    payload,
    { method: "POST", skipAuth: true },
  );
}

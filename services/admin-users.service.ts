import { ApiError, apiJson, apiRequest } from "@/lib/api";
import type { PaginationMeta } from "@/lib/pagination";

export type AdminUserRow = {
  id: string;
  code: string;
  name: string;
  username: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  isDeleted: boolean;
  status: "active" | "disabled" | string;
  createdAt: string;
  owner: { id: number; status: string } | null;
};

export type AdminUserOwnerDetail = {
  id: number;
  status: string;
  phone: string;
  bio: string | null;
  profile: string;
  cover: string | null;
  comment: string | null;
  jawaz: { number: string; images: string[] } | null;
};

export type AdminUserAddress = {
  id: number;
  province: string;
  city: string;
  street: string;
};

export type AdminUserDetail = AdminUserRow & {
  updatedAt: string;
  addresses: AdminUserAddress[];
  ownerDetail: AdminUserOwnerDetail | null;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  status: number;
  data?: T;
};

export type FetchAdminUsersParams = {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: "active" | "disabled" | "all";
};

export type FetchAdminUsersResult = {
  users: AdminUserRow[];
  pagination: PaginationMeta;
};

export type CreateAdminUserInput = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  roleNames: Array<"admin" | "manager" | "staff">;
};

function normalizeUser(input: unknown): AdminUserRow | null {
  if (!input || typeof input !== "object") return null;
  const row = input as Record<string, unknown>;
  const roles = Array.isArray(row.roles) ? row.roles : [];
  const firstRole = roles.find(
    (role): role is Record<string, unknown> =>
      Boolean(role) && typeof role === "object",
  );
  const status = String(row.status ?? "active");
  const id = String(row.id ?? "");
  if (!id) return null;

  return {
    id,
    code: String(row.code ?? ""),
    name: String(row.name ?? row.fullName ?? row.username ?? ""),
    username: String(row.username ?? ""),
    email: String(row.email ?? ""),
    role: String(row.role ?? firstRole?.name ?? "staff"),
    isEmailVerified: Boolean(row.isEmailVerified ?? row.email),
    isDeleted: status === "disabled" || Boolean(row.isDeleted),
    status,
    createdAt: String(row.createdAt ?? ""),
    owner:
      row.owner && typeof row.owner === "object"
        ? {
            id: Number((row.owner as Record<string, unknown>).id),
            status: String((row.owner as Record<string, unknown>).status ?? ""),
          }
        : null,
  };
}

export async function fetchAdminUsers(
  params: FetchAdminUsersParams = {},
): Promise<FetchAdminUsersResult> {
  const query = new URLSearchParams();
  if (params.page != null) query.set("page", String(params.page));
  if (params.limit != null) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.role?.trim()) query.set("role", params.role.trim());
  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }

  const qs = query.toString() ? `?${query.toString()}` : "";
  const res = await apiRequest<
    | ApiEnvelope<{
        users?: unknown[];
        pagination?: PaginationMeta;
      }>
    | {
        data?: unknown[];
        pagination?: PaginationMeta & { limit?: number };
      }
  >(`/api/users${qs}`, { method: "GET" });

  const rawData = "data" in res ? res.data : undefined;
  const raw =
    rawData && !Array.isArray(rawData) && typeof rawData === "object"
      ? (rawData as { users?: unknown[]; pagination?: PaginationMeta })
      : undefined;
  const list = Array.isArray(rawData) ? rawData : (raw?.users ?? []);
  const pagination = ("pagination" in res ? res.pagination : raw?.pagination) ?? {
    page: params.page ?? 1,
    pageSize: params.limit ?? 10,
    total: list.length,
    totalPages: 1,
  };
  const paginationRecord = pagination as PaginationMeta & { limit?: number };

  return {
    users: list.map(normalizeUser).filter(Boolean) as AdminUserRow[],
    pagination: {
      page: paginationRecord.page,
      pageSize: paginationRecord.limit ?? paginationRecord.pageSize ?? params.limit ?? 10,
      total: paginationRecord.total,
      totalPages: paginationRecord.totalPages,
    },
  };
}

export async function fetchAllAdminUsers(
  params: Omit<FetchAdminUsersParams, "page" | "limit"> = {},
): Promise<AdminUserRow[]> {
  const limit = 100;
  let page = 1;
  let totalPages = 1;
  const all: AdminUserRow[] = [];

  do {
    const result = await fetchAdminUsers({ ...params, page, limit });
    all.push(...result.users);
    totalPages = result.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);

  return all;
}

export async function createAdminUser(
  input: CreateAdminUserInput,
): Promise<AdminUserDetail> {
  const res = await apiJson<{ user?: unknown }, CreateAdminUserInput>(
    "/api/users",
    input,
  );
  const user = normalizeUserDetail(res.user);
  if (!user) {
    throw new ApiError("Invalid user response.", { status: 500 });
  }
  return user;
}

export async function updateAdminUserStatus(
  userId: string,
  status: "active" | "disabled",
): Promise<AdminUserDetail> {
  const res = await apiRequest<{ user?: unknown }>(`/api/users/${userId}`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify({ status }),
  });
  const user = normalizeUserDetail(res.user);
  if (!user) {
    throw new ApiError("Invalid user response.", { status: 500 });
  }
  return user;
}

export async function deleteAdminUser(userId: string): Promise<AdminUserDetail> {
  const res = await apiRequest<{ user?: unknown }>(`/api/users/${userId}`, {
    method: "DELETE",
  });
  const user = normalizeUserDetail(res.user);
  if (!user) {
    throw new ApiError("Invalid user response.", { status: 500 });
  }
  return user;
}

function normalizeUserDetail(input: unknown): AdminUserDetail | null {
  const base = normalizeUser(input);
  if (!base || typeof input !== "object") return null;
  const row = input as Record<string, unknown>;
  const ownerDetailRaw = row.ownerDetail ?? row.owner;
  let ownerDetail: AdminUserOwnerDetail | null = null;
  if (ownerDetailRaw && typeof ownerDetailRaw === "object") {
    const owner = ownerDetailRaw as Record<string, unknown>;
    ownerDetail = {
      id: Number(owner.id),
      status: String(owner.status ?? ""),
      phone: String(owner.phone ?? ""),
      bio: (owner.bio as string | null | undefined) ?? null,
      profile: String(owner.profile ?? ""),
      cover: (owner.cover as string | null | undefined) ?? null,
      comment: (owner.comment as string | null | undefined) ?? null,
      jawaz:
        owner.jawaz && typeof owner.jawaz === "object"
          ? {
              number: String((owner.jawaz as Record<string, unknown>).number ?? ""),
              images: Array.isArray((owner.jawaz as Record<string, unknown>).images)
                ? ((owner.jawaz as Record<string, unknown>).images as string[])
                : [],
            }
          : null,
    };
  }

  const addresses = Array.isArray(row.addresses)
    ? row.addresses
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const address = item as Record<string, unknown>;
          return {
            id: Number(address.id),
            province: String(address.province ?? ""),
            city: String(address.city ?? ""),
            street: String(address.street ?? ""),
          };
        })
        .filter(Boolean)
    : [];

  return {
    ...base,
    updatedAt: String(row.updatedAt ?? base.createdAt),
    addresses: addresses as AdminUserAddress[],
    ownerDetail,
  };
}

export async function fetchAdminUserById(id: string): Promise<AdminUserDetail> {
  const res = await apiRequest<ApiEnvelope<{ user?: unknown }> | { user?: unknown }>(
    `/api/users/${id}`,
    { method: "GET" },
  );
  const rawData = "data" in res ? res.data : res;
  const raw = rawData as { user?: unknown } | undefined;
  const user = normalizeUserDetail(raw?.user ?? rawData);
  if (!user) {
    throw new ApiError(("message" in res && res.message) || "User not found", {
      status: ("status" in res && res.status) || 404,
    });
  }
  return user;
}

function jsonHeaders(): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  return headers;
}

export async function updateAdminUserEmailVerification(
  userId: string,
  action: "verified" | "unverified",
): Promise<AdminUserDetail> {
  const res = await apiRequest<ApiEnvelope<{ user?: unknown }>>(
    `/api/users/${userId}/email-verification`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ action }),
    },
  );

  const raw = res.data as { user?: unknown } | undefined;
  const user = normalizeUserDetail(raw?.user ?? res.data);
  if (!user) {
    throw new ApiError(res.message || "Could not update verification.", {
      status: res.status || 500,
    });
  }
  return user;
}

export async function requestAdminUserEmailVerification(
  userId: string,
  input?: { message?: string },
): Promise<void> {
  await apiJson<ApiEnvelope<unknown>>(
    `/api/users/${userId}/request-email-verification`,
    input?.message?.trim() ? { message: input.message.trim() } : {},
  );
}

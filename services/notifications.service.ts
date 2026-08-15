import { ApiError, apiRequest } from "@/lib/api";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  status: number;
  data?: T;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AppNotification = {
  id: number;
  source: "user" | "owner";
  userId: number;
  type: string;
  title: string;
  message: string;
  href?: string | null;
  read: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NotificationsResult = {
  notifications: AppNotification[];
  unreadCount: number;
  pagination: Pagination | null;
};

function normalizeNotification(input: unknown): AppNotification | null {
  if (!input || typeof input !== "object") return null;
  const row = input as Record<string, unknown>;

  const read =
    typeof row.read === "boolean"
      ? row.read
      : typeof row.isRead === "boolean"
        ? row.isRead
        : false;

  const createdAt = String(row.createdAt ?? "");
  const updatedAt = String(row.updatedAt ?? createdAt);

  const source =
    row.source === "user" || row.source === "owner" ? row.source : "owner";

  return {
    id: Number(row.id),
    source,
    userId: Number(row.userId ?? 0),
    type: String(row.type ?? "general"),
    title: String(row.title ?? "Notification"),
    message: String(row.message ?? ""),
    href:
      typeof row.href === "string" && row.href.trim()
        ? row.href.trim()
        : null,
    read,
    createdAt,
    updatedAt,
  };
}

export async function fetchNotifications(options?: {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}): Promise<NotificationsResult> {
  const qs = new URLSearchParams();
  if (options?.page) qs.set("page", String(options.page));
  if (options?.pageSize) qs.set("pageSize", String(options.pageSize));
  if (options?.unreadOnly) qs.set("unreadOnly", "true");

  const path = qs.toString()
    ? `/api/notifications?${qs.toString()}`
    : "/api/notifications";

  const res = await apiRequest<
    ApiEnvelope<{
      notifications: unknown[];
      unreadCount: number;
      pagination: Pagination;
    }>
  >(path, { method: "GET" });

  if (!res.success) {
    throw new ApiError(res.message || "Could not load notifications.", {
      status: res.status ?? 500,
    });
  }

  const notifications = (res.data?.notifications ?? [])
    .map(normalizeNotification)
    .filter(Boolean) as AppNotification[];

  return {
    notifications,
    unreadCount: res.data?.unreadCount ?? 0,
    pagination: res.data?.pagination ?? null,
  };
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const res = await apiRequest<ApiEnvelope<{ unreadCount: number }>>(
    "/api/notifications/unread-count",
    { method: "GET" },
  );

  if (!res.success) {
    throw new ApiError(res.message || "Could not load notification count.", {
      status: res.status ?? 500,
    });
  }

  return res.data?.unreadCount ?? 0;
}

export async function fetchNotificationById(
  id: number,
  source: "user" | "owner" = "owner",
): Promise<AppNotification> {
  const res = await apiRequest<ApiEnvelope<{ notification: unknown }>>(
    `/api/notifications/${id}?source=${source}`,
    { method: "GET" },
  );

  if (!res.success) {
    throw new ApiError(res.message || "Notification not found.", {
      status: res.status ?? 404,
    });
  }

  const notification = normalizeNotification(res.data?.notification);
  if (!notification) {
    throw new ApiError("Notification not found.", { status: 404 });
  }

  return notification;
}

export async function markNotificationRead(
  id: number,
  source: "user" | "owner" = "owner",
): Promise<void> {
  const res = await apiRequest<ApiEnvelope<unknown>>(
    `/api/notifications/${id}/read?source=${source}`,
    { method: "PATCH" },
  );

  if (!res.success) {
    throw new ApiError(res.message || "Could not update notification.", {
      status: res.status ?? 500,
    });
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await apiRequest<ApiEnvelope<unknown>>(
    "/api/notifications/read-all",
    { method: "PATCH" },
  );

  if (!res.success) {
    throw new ApiError(res.message || "Could not update notifications.", {
      status: res.status ?? 500,
    });
  }
}

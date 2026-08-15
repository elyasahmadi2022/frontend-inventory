import { ApiError, apiFetch, apiRequest } from "@/lib/api";

type ApiEnvelope<TData> = {
  settings?: TData;
  permission?: TData;
  role?: TData;
  roles?: TData;
  permissions?: TData;
};

export type StoreSettings = {
  id?: string;
  storeName: string;
  logoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  website?: string | null;
  taxNumber?: string | null;
  invoiceNote?: string | null;
};

export type InvoiceSection =
  | "header"
  | "partner"
  | "lines"
  | "summary"
  | "footer";
export type InvoiceTemplate = {
  accentColor: string;
  pageSize: "a4" | "a5" | "letter";
  orientation: "portrait" | "landscape";
  compact: boolean;
  showLogo: boolean;
  showContact: boolean;
  showNotes: boolean;
  showSignature: boolean;
  sectionOrder: InvoiceSection[];
  positions: Record<InvoiceSection, { x: number; y: number; width: number }>;
};

export function fetchInvoiceTemplate() {
  return apiRequest<{ template: InvoiceTemplate }>(
    "/api/settings/invoice-template",
  );
}

export function saveInvoiceTemplate(template: InvoiceTemplate) {
  return apiRequest<{ template: InvoiceTemplate }>(
    "/api/settings/invoice-template",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    },
  );
}

export type UpdateStoreSettingsInput = Partial<
  Pick<
    StoreSettings,
    | "storeName"
    | "phone"
    | "email"
    | "address"
    | "city"
    | "country"
    | "website"
    | "taxNumber"
    | "invoiceNote"
  >
> & {
  logo?: File | null;
};

export type DatabaseBackupResult = {
  blob: Blob;
  filename: string;
  createdAt: string;
  tableCount: number;
  recordCount: number;
  size: number;
};

export type BackupFrequency = "hourly" | "daily" | "weekly";
export type BackupScheduleResult = {
  schedule: {
    enabled: boolean;
    frequency: BackupFrequency;
    path: string;
    lastRunAt?: string | null;
    nextRunAt?: string | null;
    lastFilename?: string | null;
    lastError?: string | null;
  };
  backupRoot: string;
  effectivePath: string;
  filename?: string;
  size?: number;
};

export function fetchBackupSchedule() {
  return apiRequest<BackupScheduleResult>("/api/settings/backup/schedule");
}

export function fetchBackupDirectories() {
  return apiRequest<{ backupRoot: string; directories: string[] }>(
    "/api/settings/backup/directories",
  );
}

export function saveBackupSchedule(input: {
  enabled: boolean;
  frequency: BackupFrequency;
  path: string;
}) {
  return apiRequest<BackupScheduleResult>("/api/settings/backup/schedule", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function runServerBackup() {
  return apiRequest<BackupScheduleResult>("/api/settings/backup/run", {
    method: "POST",
  });
}

export async function downloadDatabaseBackup(): Promise<DatabaseBackupResult> {
  const response = await apiFetch("/api/settings/backup", { method: "GET" });
  if (!response.ok) {
    throw new ApiError("Could not create the database backup.", {
      status: response.status,
    });
  }
  const blob = await response.blob();
  const payload = JSON.parse(await blob.text()) as {
    createdAt?: string;
    summary?: { tableCount?: number; recordCount?: number };
  };
  const disposition = response.headers.get("content-disposition") ?? "";
  const filename =
    disposition.match(/filename="([^"]+)"/)?.[1] ??
    `store-backup-${Date.now()}.json`;
  return {
    blob,
    filename,
    createdAt: payload.createdAt ?? new Date().toISOString(),
    tableCount: Number(payload.summary?.tableCount ?? 0),
    recordCount: Number(payload.summary?.recordCount ?? 0),
    size: blob.size,
  };
}

export type PermissionEffect = "allow" | "deny";

export type PermissionRow = {
  id: string;
  key: string;
  description?: string | null;
};

export type RolePermissionRow = {
  key: string;
  description?: string | null;
  effect: PermissionEffect;
};

export type RoleRow = {
  id: string;
  name: string;
  description?: string | null;
  permissions: RolePermissionRow[];
};

export type SaveRoleInput = {
  name: string;
  description?: string | null;
  permissions: { key: string; effect: PermissionEffect }[];
};

export type SavePermissionInput = {
  key: string;
  description?: string | null;
};

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const res = await apiRequest<ApiEnvelope<StoreSettings>>("/api/settings", {
    method: "GET",
  });
  if (!res.settings) {
    throw new ApiError("Invalid settings response from server.", {
      status: 500,
    });
  }
  return res.settings;
}

export async function updateStoreSettings(
  input: UpdateStoreSettingsInput,
): Promise<StoreSettings> {
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (key === "logo" || value === undefined || value === null) continue;
    form.set(key, String(value));
  }
  if (input.logo) form.set("logo", input.logo);

  const res = await apiRequest<ApiEnvelope<StoreSettings>>("/api/settings", {
    method: "PATCH",
    body: form,
  });
  if (!res.settings) {
    throw new ApiError("Invalid settings response from server.", {
      status: 500,
    });
  }
  return res.settings;
}

export async function fetchPermissions(): Promise<PermissionRow[]> {
  const res = await apiRequest<ApiEnvelope<PermissionRow[]>>(
    "/api/users/permissions",
    { method: "GET" },
  );
  return Array.isArray(res.permissions) ? res.permissions : [];
}

export async function createPermission(
  input: SavePermissionInput,
): Promise<PermissionRow> {
  const res = await apiRequest<ApiEnvelope<PermissionRow>>(
    "/api/users/permissions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!res.permission) {
    throw new ApiError("Invalid permission response.", { status: 500 });
  }
  return res.permission;
}

export async function updatePermission(
  id: string,
  input: SavePermissionInput,
): Promise<PermissionRow> {
  const res = await apiRequest<ApiEnvelope<PermissionRow>>(
    `/api/users/permissions/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!res.permission) {
    throw new ApiError("Invalid permission response.", { status: 500 });
  }
  return res.permission;
}

export async function fetchRoles(): Promise<RoleRow[]> {
  const res = await apiRequest<ApiEnvelope<RoleRow[]>>("/api/users/roles", {
    method: "GET",
  });
  return Array.isArray(res.roles) ? res.roles : [];
}

export async function createRole(input: SaveRoleInput): Promise<RoleRow> {
  const res = await apiRequest<ApiEnvelope<RoleRow>>("/api/users/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.role) throw new ApiError("Invalid role response.", { status: 500 });
  return res.role;
}

export async function updateRole(
  id: string,
  input: SaveRoleInput,
): Promise<RoleRow> {
  const res = await apiRequest<ApiEnvelope<RoleRow>>(`/api/users/roles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.role) throw new ApiError("Invalid role response.", { status: 500 });
  return res.role;
}

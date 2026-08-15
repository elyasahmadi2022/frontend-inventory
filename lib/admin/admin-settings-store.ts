import {
  buildAdminSettingsDefaults,
  type AdminSettingsField,
} from "@/lib/admin/admin-settings-catalog";

const STORAGE_KEY = "luilal:admin-settings";

export type AdminSettingsValues = Record<string, string | number | boolean>;

function readStorage(): AdminSettingsValues {
  if (typeof window === "undefined") {
    return buildAdminSettingsDefaults();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildAdminSettingsDefaults();
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return buildAdminSettingsDefaults();
    return { ...buildAdminSettingsDefaults(), ...(parsed as AdminSettingsValues) };
  } catch {
    return buildAdminSettingsDefaults();
  }
}

export function getAdminSettings(): AdminSettingsValues {
  return readStorage();
}

export function saveAdminSettings(values: AdminSettingsValues): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
}

export function getFieldValue(
  values: AdminSettingsValues,
  field: AdminSettingsField,
): string | number | boolean {
  const stored = values[field.key];
  if (stored !== undefined) return stored;
  if (field.defaultValue !== undefined) return field.defaultValue;
  if (field.type === "toggle") return false;
  if (field.type === "number") return 0;
  return "";
}

export function coerceFieldValue(
  field: AdminSettingsField,
  raw: string | number | boolean,
): string | number | boolean {
  if (field.type === "toggle") return Boolean(raw);
  if (field.type === "number") {
    const num = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(num)) return field.defaultValue ?? 0;
    if (field.min != null) return Math.max(field.min, num);
    if (field.max != null) return Math.min(field.max, num);
    return num;
  }
  return String(raw);
}

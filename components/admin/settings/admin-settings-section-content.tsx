"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { formatAdminNumber } from "@/components/admin/shared/admin-money-display";
import { InputField } from "@/components/common";
import { FormModal } from "@/components/common/form-modal";
import { LoaderMini } from "@/components/common/loader-mini";
import { SelectField } from "@/components/common/select-field";
import { ToggleSwitch } from "@/components/common/toggle-switch";
import { SettingsPanel, SettingsRow } from "@/components/dashboard/settings-ui";
import {
  getAdminSettingsSection,
  type AdminSettingsField,
  type AdminSettingsSectionId,
} from "@/lib/admin/admin-settings-catalog";
import {
  ADMIN_SETTINGS_FIELD_TONE,
  adminSettingsTextareaClass,
} from "@/lib/admin/admin-settings-input-styles";
import { resolveUploadAssetUrl } from "@/lib/asset-url";
import {
  coerceFieldValue,
  getAdminSettings,
  getFieldValue,
  saveAdminSettings,
  type AdminSettingsValues,
} from "@/lib/admin/admin-settings-store";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  createPermission,
  createRole,
  downloadDatabaseBackup,
  fetchBackupSchedule,
  fetchPermissions,
  fetchRoles,
  fetchStoreSettings,
  saveBackupSchedule,
  type BackupFrequency,
  type BackupScheduleResult,
  updatePermission,
  updateRole,
  updateStoreSettings,
  type PermissionEffect,
  type PermissionRow,
  type RoleRow,
  type SavePermissionInput,
  type SaveRoleInput,
  type StoreSettings,
} from "@/services/admin-settings.service";
import {
  createCurrency,
  deleteCurrency,
  fetchCurrencies,
  updateCurrency,
  type CurrencyCode,
  type CurrencyRow,
  type SaveCurrencyInput,
} from "@/services/currencies.service";
import {
  createAccount,
  fetchAccounts,
  updateAccount,
  type AccountRow,
  type CurrencyCode as AccountCurrencyCode,
  type SaveAccountInput,
} from "@/services/accounts.service";
import { gooeyToast } from "goey-toast";
import {
  DatabaseBackup,
  Download,
  Edit3,
  FolderOpen,
  ImagePlus,
  Layers3,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AdminSettingsSectionContentProps = {
  sectionId: AdminSettingsSectionId;
  hideHeader?: boolean;
};

type EditableValue = string | number | boolean;

type WritableFileHandle = {
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
};

type BackupDirectoryHandle = {
  name: string;
  getFileHandle: (
    name: string,
    options: { create: true },
  ) => Promise<WritableFileHandle>;
};

const settingKeyMap: Record<string, keyof StoreSettings> = {
  "general.storeName": "storeName",
  "general.logo": "logoUrl",
  "general.contactPhone": "phone",
  "general.contactEmail": "email",
  "general.address": "address",
  "general.taxId": "taxNumber",
};

function valueLabel(value: EditableValue): string {
  if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
  if (String(value).trim()) return String(value);
  return "Not set";
}

function buildStoreValues(settings: StoreSettings): AdminSettingsValues {
  return {
    "general.storeName": settings.storeName,
    "general.logo": settings.logoUrl ?? "",
    "general.contactPhone": settings.phone ?? "",
    "general.contactEmail": settings.email ?? "",
    "general.address": settings.address ?? "",
    "general.taxId": settings.taxNumber ?? "",
  };
}

function SettingsFieldDisplay({
  field,
  value,
}: {
  field: AdminSettingsField;
  value: EditableValue;
}) {
  const { t } = useI18n();
  const label = t(field.labelKey);

  if (field.type === "image") {
    const imageValue =
      typeof value === "string"
        ? (resolveUploadAssetUrl(value, "other") ?? "")
        : "";
    return (
      <div className="flex items-center justify-end gap-3">
        <div className="flex size-14 items-center justify-center overflow-hidden border border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg">
          {imageValue ? (
            <span
              aria-label={`${label} preview`}
              className="block size-full bg-cover bg-center"
              style={{ backgroundImage: `url(${imageValue})` }}
            />
          ) : (
            <ImagePlus className="size-5 text-muted" aria-hidden="true" />
          )}
        </div>
        <span className="text-sm text-muted">
          {imageValue ? "Uploaded" : "No image"}
        </span>
      </div>
    );
  }

  return (
    <span className="max-w-md text-right text-sm font-medium text-light-text dark:text-dark-text">
      {valueLabel(value)}
    </span>
  );
}

function SettingsFieldControl({
  field,
  value,
  onChange,
  onImageFile,
}: {
  field: AdminSettingsField;
  value: EditableValue;
  onChange: (next: EditableValue) => void;
  onImageFile?: (file: File | null) => void;
}) {
  const { t } = useI18n();
  const label = t(field.labelKey);
  const placeholder = field.placeholderKey
    ? t(field.placeholderKey)
    : undefined;

  if (field.type === "image") {
    const imageValue = typeof value === "string" ? value : "";

    function handleImageSelected(event: React.ChangeEvent<HTMLInputElement>) {
      const file = event.target.files?.[0] ?? null;
      event.target.value = "";
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        gooeyToast.error("Invalid image", {
          description: "Choose a PNG, JPG, JPEG, or WebP image.",
        });
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        gooeyToast.error("Image is too large", {
          description: "Logo image must be 2MB or smaller.",
        });
        return;
      }

      const preview = URL.createObjectURL(file);
      onChange(preview);
      onImageFile?.(file);
    }

    return (
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <SettingsFieldDisplay field={field} value={value} />
        <div className="flex flex-wrap justify-end gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 border border-light-border bg-light-bg px-3 py-2 text-sm font-semibold text-light-text transition hover:border-primary-500 hover:text-primary-600 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:hover:text-primary-500">
            <ImagePlus className="size-4" aria-hidden="true" />
            Upload image
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="sr-only"
              onChange={handleImageSelected}
            />
          </label>
          {imageValue ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                onImageFile?.(null);
              }}
              className="inline-flex items-center gap-2 border border-light-border bg-light-bg px-3 py-2 text-sm font-semibold text-light-text transition hover:border-red-400 hover:text-red-600 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:hover:text-red-400"
            >
              <X className="size-4" aria-hidden="true" />
              Remove
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (field.type === "toggle") {
    return (
      <ToggleSwitch
        id={`admin-setting-${field.key}`}
        checked={Boolean(value)}
        onCheckedChange={(checked) => onChange(checked)}
        aria-label={label}
      />
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <SelectField
        value={String(value)}
        onChange={(next) => onChange(next)}
        options={field.options.map((opt) => ({
          value: opt.value,
          label: t(opt.labelKey),
        }))}
        tone={ADMIN_SETTINGS_FIELD_TONE}
        className="w-full min-w-48"
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder={placeholder}
        className={adminSettingsTextareaClass}
      />
    );
  }

  if (field.type === "number") {
    return (
      <InputField
        type="number"
        value={String(value)}
        min={field.min}
        max={field.max}
        tone={ADMIN_SETTINGS_FIELD_TONE}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-32"
      />
    );
  }

  return (
    <InputField
      type={
        field.type === "password"
          ? "password"
          : field.type === "email"
            ? "email"
            : field.type === "tel"
              ? "tel"
              : field.type === "url"
                ? "url"
                : "text"
      }
      value={String(value)}
      placeholder={placeholder}
      tone={ADMIN_SETTINGS_FIELD_TONE}
      onChange={(event) => onChange(event.target.value)}
      className="w-full min-w-48"
    />
  );
}

function RoleEditor({
  role,
  permissions,
  open,
  onCancel,
  onSaved,
}: {
  role?: RoleRow | null;
  permissions: PermissionRow[];
  open: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selectedPermissionKey, setSelectedPermissionKey] = useState("");
  const [selectedEffect, setSelectedEffect] =
    useState<PermissionEffect>("allow");
  const [selected, setSelected] = useState<
    { key: string; effect: PermissionEffect }[]
  >(() =>
    (role?.permissions ?? []).map((permission) => ({
      key: permission.key,
      effect: permission.effect,
    })),
  );
  const [saving, setSaving] = useState(false);

  const selectedKeys = useMemo(
    () => new Set(selected.map((permission) => permission.key)),
    [selected],
  );

  const permissionOptions = useMemo(
    () =>
      permissions.map((permission) => ({
        value: permission.key,
        label: permission.key,
        description: permission.description ?? undefined,
        disabled: selectedKeys.has(permission.key),
      })),
    [permissions, selectedKeys],
  );

  const selectedPermissions = useMemo(
    () =>
      selected.map((item) => ({
        key: item.key,
        effect: item.effect,
        description:
          permissions.find((permission) => permission.key === item.key)
            ?.description ?? null,
      })),
    [permissions, selected],
  );

  useEffect(() => {
    if (!open) return;
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setSelectedPermissionKey("");
    setSelectedEffect("allow");
    setSelected(
      (role?.permissions ?? []).map((permission) => ({
        key: permission.key,
        effect: permission.effect,
      })),
    );
  }, [open, role]);

  function upsertPermission(key: string, effect: PermissionEffect) {
    setSelected((current) => {
      const existingIndex = current.findIndex((item) => item.key === key);
      if (existingIndex >= 0) {
        const next = [...current];
        next[existingIndex] = { key, effect };
        return next;
      }
      return [...current, { key, effect }];
    });
  }

  async function handleSubmit() {
    if (!name.trim()) {
      gooeyToast.error(t("admin.settings.role.nameRequiredTitle"), {
        description: t("admin.settings.role.nameRequiredDescription"),
      });
      return;
    }

    const pendingKey = selectedPermissionKey.trim();
    const permissionsToSave = pendingKey
      ? [
          ...selected.filter((item) => item.key !== pendingKey),
          { key: pendingKey, effect: selectedEffect },
        ]
      : selected;

    const input: SaveRoleInput = {
      name: name.trim(),
      description: description.trim() || null,
      permissions: permissionsToSave,
    };

    setSaving(true);
    try {
      if (role) {
        await updateRole(role.id, input);
      } else {
        await createRole(input);
      }
      gooeyToast.success(
        role
          ? t("admin.settings.role.updatedTitle")
          : t("admin.settings.role.createdTitle"),
        { description: t("admin.settings.role.savedDescription") },
      );
      onSaved();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : t("admin.settings.role.saveFailedFallback");
      gooeyToast.error(t("admin.settings.role.saveFailedTitle"), {
        description: message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormModal
      open={open}
      title={
        role
          ? t("admin.settings.role.editTitle", { name: role.name })
          : t("admin.settings.role.addTitle")
      }
      description={t("admin.settings.role.modalDescription")}
      onClose={onCancel}
      onSubmit={() => void handleSubmit()}
      submitting={saving}
      submitLabel={
        role ? t("admin.settings.role.update") : t("admin.settings.role.create")
      }
      panelClassName="w-full max-w-3xl"
    >
      <div className="col-span-2">
        <InputField
          label={t("admin.settings.role.nameLabel")}
          value={name}
          onChange={(event) => setName(event.target.value)}
          tone={ADMIN_SETTINGS_FIELD_TONE}
          placeholder={t("admin.settings.role.namePlaceholder")}
          className="w-full min-w-48"
        />
      </div>
      <div className="col-span-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-light-text dark:text-dark-text">
            {t("admin.settings.role.descriptionLabel")}
          </span>
          <textarea
            placeholder={t("admin.settings.role.descriptionPlaceholder")}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className={adminSettingsTextareaClass}
          />
        </label>
      </div>

      <div className="col-span-2 grid gap-3 border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-dark-surface sm:grid-cols-[10rem_1fr]">
        <SelectField
          options={[
            { value: "allow", label: t("admin.settings.common.allow") },
            { value: "deny", label: t("admin.settings.common.deny") },
          ]}
          label={t("admin.settings.role.effectLabel")}
          value={selectedEffect}
          onChange={(next) => setSelectedEffect(next as PermissionEffect)}
          clearable={false}
          tone={ADMIN_SETTINGS_FIELD_TONE}
        />
        <SelectField
          options={permissionOptions}
          label={t("admin.settings.role.permissionLabel")}
          value={selectedPermissionKey}
          onChange={(key) => {
            if (!key.trim()) {
              setSelectedPermissionKey("");
              return;
            }
            upsertPermission(key.trim(), selectedEffect);
            setSelectedPermissionKey("");
            setSelectedEffect("allow");
          }}
          placeholder={t("admin.settings.role.permissionPlaceholder")}
          searchable
          tone={ADMIN_SETTINGS_FIELD_TONE}
        />
      </div>

      <div className="col-span-2 border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface">
        <div className="border-b border-light-border px-4 py-3 dark:border-dark-border">
          <p className="text-sm font-semibold text-light-text dark:text-dark-text">
            {t("admin.settings.role.selectedTitle")}
          </p>
          <p className="mt-1 text-xs text-muted">
            {t("admin.settings.role.selectedDescription")}
          </p>
        </div>
        {selectedPermissions.length > 0 ? (
          selectedPermissions.map((permission) => (
            <div
              key={permission.key}
              className="flex flex-col gap-3 border-b border-light-border px-4 py-3 last:border-b-0 dark:border-dark-border sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-light-text dark:text-dark-text">
                  {permission.key}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {permission.description ??
                    t("admin.settings.common.noDescription")}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <span
                  className={
                    permission.effect === "allow"
                      ? "border border-emerald-500/30 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "border border-red-500/30 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300"
                  }
                >
                  {permission.effect === "allow"
                    ? t("admin.settings.common.allow")
                    : t("admin.settings.common.deny")}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSelected((current) =>
                      current.filter((item) => item.key !== permission.key),
                    )
                  }
                  className="inline-flex items-center gap-1.5 border border-light-border bg-light-bg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-400 dark:border-dark-border dark:bg-dark-bg dark:text-red-400"
                >
                  <X className="size-3.5" aria-hidden="true" />
                  {t("admin.settings.common.remove")}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-sm text-muted">
            {t("admin.settings.role.noneSelected")}
          </div>
        )}
      </div>
    </FormModal>
  );
}

function PermissionEditor({
  permission,
  open,
  onCancel,
  onSaved,
}: {
  permission?: PermissionRow | null;
  open: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [key, setKey] = useState(permission?.key ?? "");
  const [description, setDescription] = useState(permission?.description ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setKey(permission?.key ?? "");
    setDescription(permission?.description ?? "");
  }, [permission]);

  async function handleSubmit() {
    if (!key.trim()) {
      gooeyToast.error(t("admin.settings.permission.keyRequiredTitle"), {
        description: t("admin.settings.permission.keyRequiredDescription"),
      });
      return;
    }

    const input: SavePermissionInput = {
      key: key.trim(),
      description: description.trim() || null,
    };

    setSaving(true);
    try {
      if (permission) {
        await updatePermission(permission.id, input);
      } else {
        await createPermission(input);
      }
      gooeyToast.success(
        permission
          ? t("admin.settings.permission.updatedTitle")
          : t("admin.settings.permission.createdTitle"),
        { description: t("admin.settings.permission.savedDescription") },
      );
      onSaved();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : t("admin.settings.permission.saveFailedFallback");
      gooeyToast.error(t("admin.settings.permission.saveFailedTitle"), {
        description: message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormModal
      open={open}
      title={
        permission
          ? t("admin.settings.permission.editTitle", { key: permission.key })
          : t("admin.settings.permission.addTitle")
      }
      description={t("admin.settings.permission.modalDescription")}
      onClose={onCancel}
      onSubmit={() => void handleSubmit()}
      submitting={saving}
      submitLabel={
        permission
          ? t("admin.settings.permission.update")
          : t("admin.settings.permission.create")
      }
      contentClassName="!grid-cols-1"
    >
      <InputField
        label={t("admin.settings.permission.keyLabel")}
        value={key}
        onChange={(event) => setKey(event.target.value)}
        tone={ADMIN_SETTINGS_FIELD_TONE}
        placeholder={t("admin.settings.permission.keyPlaceholder")}
      />
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-light-text dark:text-dark-text">
          {t("admin.settings.permission.descriptionLabel")}
        </span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          placeholder={t("admin.settings.permission.descriptionPlaceholder")}
          className={adminSettingsTextareaClass}
        />
      </label>
    </FormModal>
  );
}

const supportedCurrencyCodes: CurrencyCode[] = ["AFN", "USD", "PKR"];
const supportedExpenseCategoryCurrencies: AccountCurrencyCode[] = [
  "AFN",
  "USD",
  "PKR",
];

function ExpenseCategoryEditor({
  category,
  open,
  onCancel,
  onSaved,
}: {
  category?: AccountRow | null;
  open: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(category?.name ?? "");
  const [currencyCode, setCurrencyCode] = useState<AccountCurrencyCode>(
    (category?.currencyCode as AccountCurrencyCode | undefined) ?? "AFN",
  );
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setCurrencyCode(
      (category?.currencyCode as AccountCurrencyCode | undefined) ?? "AFN",
    );
    setIsActive(category?.isActive ?? true);
  }, [category, open]);

  async function handleSubmit() {
    if (!name.trim()) {
      gooeyToast.error(
        t("admin.settings.expenseCategories.nameRequiredTitle"),
        {
          description: t(
            "admin.settings.expenseCategories.nameRequiredDescription",
          ),
        },
      );
      return;
    }

    setSaving(true);
    try {
      if (category) {
        await updateAccount(category.id, {
          name: name.trim(),
          currencyCode,
          isActive,
          isControlAccount: true,
        });
      } else {
        const payload: SaveAccountInput = {
          name: name.trim(),
          category: "expense",
          type: "expense",
          normalBalance: "debit",
          currencyCode,
          isControlAccount: true,
          isActive,
        };
        await createAccount(payload);
      }
      gooeyToast.success(
        category
          ? t("admin.settings.expenseCategories.updatedTitle")
          : t("admin.settings.expenseCategories.createdTitle"),
        {
          description: t("admin.settings.expenseCategories.savedDescription"),
        },
      );
      onSaved();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : t("admin.settings.expenseCategories.saveFailedFallback");
      gooeyToast.error(t("admin.settings.expenseCategories.saveFailedTitle"), {
        description: message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormModal
      open={open}
      title={
        category
          ? t("admin.settings.expenseCategories.editTitle", {
              name: category.name,
            })
          : t("admin.settings.expenseCategories.addTitle")
      }
      description={t("admin.settings.expenseCategories.modalDescription")}
      onClose={onCancel}
      onSubmit={() => void handleSubmit()}
      submitting={saving}
      submitLabel={
        category
          ? t("admin.settings.expenseCategories.update")
          : t("admin.settings.expenseCategories.create")
      }
    >
      <div className="col-span-2">
        <InputField
          label={t("admin.settings.expenseCategories.nameLabel")}
          value={name}
          onChange={(event) => setName(event.target.value)}
          tone={ADMIN_SETTINGS_FIELD_TONE}
          placeholder={t("admin.settings.expenseCategories.namePlaceholder")}
          className="w-full min-w-48"
        />
      </div>
      <SelectField
        label={t("admin.settings.expenseCategories.currencyLabel")}
        value={currencyCode}
        onChange={(next) => setCurrencyCode(next as AccountCurrencyCode)}
        options={supportedExpenseCategoryCurrencies.map((item) => ({
          value: item,
          label: item,
        }))}
        tone={ADMIN_SETTINGS_FIELD_TONE}
      />
      <div className="flex items-center justify-between border border-light-border bg-light-bg px-3 py-2 dark:border-dark-border dark:bg-dark-bg">
        <div>
          <p className="text-sm font-medium text-light-text dark:text-dark-text">
            {t("admin.settings.expenseCategories.activeLabel")}
          </p>
          <p className="mt-1 text-xs text-muted">
            {t("admin.settings.expenseCategories.activeDescription")}
          </p>
        </div>
        <ToggleSwitch
          id="expense-category-active"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>
    </FormModal>
  );
}

function ExpenseCategoriesSettingsContent({
  hideHeader = false,
}: {
  hideHeader?: boolean;
}) {
  const { t } = useI18n();
  const [expenseAccounts, setExpenseAccounts] = useState<AccountRow[]>([]);
  const [categories, setCategories] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<
    AccountRow | null | undefined
  >();

  async function load() {
    setLoading(true);
    try {
      const accounts = await fetchAccounts({
        category: "expense",
        limit: 100,
      });
      setExpenseAccounts(accounts);
      setCategories(
        accounts.filter(
          (account) => account.type === "expense" && account.isControlAccount,
        ),
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : t("admin.settings.expenseCategories.loadFailedFallback");
      gooeyToast.error(t("admin.settings.expenseCategories.loadFailedTitle"), {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const childCountByParentId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const account of expenseAccounts) {
      if (!account.parentId) continue;
      counts.set(account.parentId, (counts.get(account.parentId) ?? 0) + 1);
    }
    return counts;
  }, [expenseAccounts]);

  return (
    <div className="space-y-2">
      <ExpenseCategoryEditor
        open={editingCategory !== undefined}
        category={editingCategory}
        onCancel={() => setEditingCategory(undefined)}
        onSaved={() => {
          setEditingCategory(undefined);
          void load();
        }}
      />

      {!hideHeader ? (
        <AdminPageHeader
          eyebrow={t("admin.settings.common.eyebrow")}
          title={t("admin.settings.expenseCategories.pageTitle")}
          description={t("admin.settings.expenseCategories.pageDescription")}
          actions={
            <button
              type="button"
              onClick={() => setEditingCategory(null)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("admin.settings.expenseCategories.new")}
            </button>
          }
        />
      ) : null}

      <section className="overflow-hidden border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface dark:shadow-dark-xs">
        <div className="grid grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr_1fr] gap-3 border-b border-light-border bg-light-bg px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted dark:border-dark-border dark:bg-dark-bg">
          <span>{t("admin.settings.expenseCategories.colName")}</span>
          <span>{t("admin.settings.expenseCategories.colCurrency")}</span>
          <span>{t("admin.settings.expenseCategories.colCode")}</span>
          <span>{t("admin.settings.expenseCategories.colStatus")}</span>
          <span className="text-right">
            {t("admin.settings.expenseCategories.colOperation")}
          </span>
        </div>
        {loading ? (
          <div className="h-32 animate-pulse bg-light-border/30 dark:bg-dark-border/30" />
        ) : categories.length > 0 ? (
          categories.map((category) => (
            <div
              key={category.id}
              className="grid grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr_1fr] items-center gap-3 border-b border-light-border px-4 py-3 text-sm last:border-b-0 dark:border-dark-border"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-light-text dark:text-dark-text">
                  {category.name}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {t("admin.settings.expenseCategories.linkedAccounts", {
                    count: childCountByParentId.get(category.id) ?? 0,
                  })}
                </p>
              </div>
              <span className="font-medium text-light-text dark:text-dark-text">
                {category.currencyCode ?? "-"}
              </span>
              <span className="font-mono text-xs text-muted">
                {category.code}
              </span>
              <span>
                <span
                  className={
                    category.isActive
                      ? "inline-flex items-center border border-emerald-500/30 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                      : "inline-flex items-center border border-rose-500/30 px-2 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300"
                  }
                >
                  {category.isActive
                    ? t("admin.settings.common.active")
                    : t("admin.settings.common.inactive")}
                </span>
              </span>
              <span className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(category)}
                  className="inline-flex items-center gap-1.5 border border-light-border bg-light-bg px-2.5 py-1.5 text-xs font-semibold text-light-text transition hover:border-primary-500 hover:text-primary-600 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:hover:text-primary-500"
                >
                  <Edit3 className="size-3.5" aria-hidden="true" />
                  {t("admin.settings.common.update")}
                </button>
              </span>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted">
            {t("admin.settings.expenseCategories.empty")}
          </div>
        )}
      </section>

      <SettingsPanel
        title={t("admin.settings.expenseCategories.helpTitle")}
        description={t("admin.settings.expenseCategories.helpDescription")}
      >
        <SettingsRow
          label={t("admin.settings.expenseCategories.helpControlLabel")}
          description={t(
            "admin.settings.expenseCategories.helpControlDescription",
          )}
        >
          <span className="inline-flex items-center gap-1 border border-primary-500/30 px-2 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
            <Layers3 className="size-3.5" aria-hidden="true" />
            {t("admin.settings.expenseCategories.helpControlBadge")}
          </span>
        </SettingsRow>
      </SettingsPanel>
    </div>
  );
}

function CurrencyEditor({
  currency,
  open,
  onCancel,
  onSaved,
}: {
  currency?: CurrencyRow | null;
  open: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [code, setCode] = useState<CurrencyCode>(currency?.code ?? "AFN");
  const [name, setName] = useState(currency?.name ?? "");
  const [symbol, setSymbol] = useState(currency?.symbol ?? "");
  const [decimalPlaces, setDecimalPlaces] = useState(
    String(currency?.decimalPlaces ?? 2),
  );
  const [isBase, setIsBase] = useState(currency?.isBase ?? false);
  const [isActive, setIsActive] = useState(currency?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCode(currency?.code ?? "AFN");
    setName(currency?.name ?? "");
    setSymbol(currency?.symbol ?? "");
    setDecimalPlaces(String(currency?.decimalPlaces ?? 2));
    setIsBase(currency?.isBase ?? false);
    setIsActive(currency?.isActive ?? true);
  }, [currency]);

  async function handleSubmit() {
    if (!name.trim() || !symbol.trim()) {
      gooeyToast.error(t("admin.settings.currency.detailsRequiredTitle"), {
        description: t("admin.settings.currency.detailsRequiredDescription"),
      });
      return;
    }

    const parsedDecimalPlaces = Number(decimalPlaces);
    if (
      !Number.isInteger(parsedDecimalPlaces) ||
      parsedDecimalPlaces < 0 ||
      parsedDecimalPlaces > 6
    ) {
      gooeyToast.error(t("admin.settings.currency.invalidDecimalTitle"), {
        description: t("admin.settings.currency.invalidDecimalDescription"),
      });
      return;
    }

    const payload: SaveCurrencyInput = {
      code,
      name: name.trim(),
      symbol: symbol.trim(),
      decimalPlaces: parsedDecimalPlaces,
      isBase,
      isActive,
    };

    setSaving(true);
    try {
      if (currency) {
        await updateCurrency(currency.code, {
          name: payload.name,
          symbol: payload.symbol,
          decimalPlaces: payload.decimalPlaces,
          isBase: payload.isBase,
          isActive: payload.isActive,
        });
      } else {
        await createCurrency(payload);
      }
      gooeyToast.success(
        currency
          ? t("admin.settings.currency.updatedTitle")
          : t("admin.settings.currency.createdTitle"),
        { description: t("admin.settings.currency.savedDescription") },
      );
      onSaved();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : t("admin.settings.currency.saveFailedFallback");
      gooeyToast.error(t("admin.settings.currency.saveFailedTitle"), {
        description: message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormModal
      open={open}
      title={
        currency
          ? t("admin.settings.currency.editTitle", { code: currency.code })
          : t("admin.settings.currency.addTitle")
      }
      description={t("admin.settings.currency.modalDescription")}
      onClose={onCancel}
      onSubmit={() => void handleSubmit()}
      submitting={saving}
      submitLabel={
        currency
          ? t("admin.settings.currency.update")
          : t("admin.settings.currency.create")
      }
    >
      <SelectField
        label={t("admin.settings.currency.codeLabel")}
        value={code}
        disabled={Boolean(currency)}
        onChange={(next) => setCode(next as CurrencyCode)}
        options={supportedCurrencyCodes.map((item) => ({
          value: item,
          label: item,
        }))}
        tone={ADMIN_SETTINGS_FIELD_TONE}
      />
      <InputField
        label={t("admin.settings.currency.nameLabel")}
        value={name}
        onChange={(event) => setName(event.target.value)}
        tone={ADMIN_SETTINGS_FIELD_TONE}
        placeholder={t("admin.settings.currency.namePlaceholder")}
      />
      <InputField
        label={t("admin.settings.currency.symbolLabel")}
        value={symbol}
        onChange={(event) => setSymbol(event.target.value)}
        tone={ADMIN_SETTINGS_FIELD_TONE}
        placeholder={t("admin.settings.currency.symbolPlaceholder")}
      />
      <InputField
        label={t("admin.settings.currency.decimalLabel")}
        type="number"
        min={0}
        max={6}
        value={decimalPlaces}
        onChange={(event) => setDecimalPlaces(event.target.value)}
        tone={ADMIN_SETTINGS_FIELD_TONE}
      />
      <div className="flex items-center justify-between border border-light-border bg-light-bg px-3 py-2 dark:border-dark-border dark:bg-dark-bg">
        <span className="text-sm font-medium text-light-text dark:text-dark-text">
          {t("admin.settings.currency.baseLabel")}
        </span>
        <ToggleSwitch
          id="currency-is-base"
          checked={isBase}
          onCheckedChange={setIsBase}
        />
      </div>
      <div className="flex items-center justify-between border border-light-border bg-light-bg px-3 py-2 dark:border-dark-border dark:bg-dark-bg">
        <span className="text-sm font-medium text-light-text dark:text-dark-text">
          {t("admin.settings.currency.activeLabel")}
        </span>
        <ToggleSwitch
          id="currency-is-active"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>
    </FormModal>
  );
}

function CurrenciesSettingsContent({
  hideHeader = false,
}: {
  hideHeader?: boolean;
}) {
  const { t } = useI18n();
  const [currencies, setCurrencies] = useState<CurrencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCurrency, setEditingCurrency] = useState<
    CurrencyRow | null | undefined
  >();
  const [deletingCode, setDeletingCode] = useState<CurrencyCode | null>(null);

  async function load() {
    setLoading(true);
    try {
      setCurrencies(await fetchCurrencies());
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : t("admin.settings.currencies.loadFailedFallback");
      gooeyToast.error(t("admin.settings.currencies.loadFailedTitle"), {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(currency: CurrencyRow) {
    setDeletingCode(currency.code);
    try {
      await deleteCurrency(currency.code);
      gooeyToast.success(t("admin.settings.currencies.disabledTitle"), {
        description: t("admin.settings.currencies.disabledDescription", {
          code: currency.code,
        }),
      });
      await load();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : t("admin.settings.currencies.deleteFailedFallback");
      gooeyToast.error(t("admin.settings.currencies.deleteFailedTitle"), {
        description: message,
      });
    } finally {
      setDeletingCode(null);
    }
  }

  return (
    <div className="space-y-2">
      <CurrencyEditor
        open={editingCurrency !== undefined}
        currency={editingCurrency}
        onCancel={() => setEditingCurrency(undefined)}
        onSaved={() => {
          setEditingCurrency(undefined);
          void load();
        }}
      />

      {!hideHeader ? (
        <AdminPageHeader
          eyebrow={t("admin.settings.common.eyebrow")}
          title={t("admin.settings.currencies.pageTitle")}
          description={t("admin.settings.currencies.pageDescription")}
          actions={
            <button
              type="button"
              onClick={() => setEditingCurrency(null)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("admin.settings.currencies.new")}
            </button>
          }
        />
      ) : null}

      <section className="border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface">
        <div className="grid grid-cols-[0.8fr_1.4fr_0.8fr_0.8fr_1fr] gap-3 border-b border-light-border px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted dark:border-dark-border">
          <span>{t("admin.settings.currencies.colCode")}</span>
          <span>{t("admin.settings.currencies.colName")}</span>
          <span>{t("admin.settings.currencies.colSymbol")}</span>
          <span>{t("admin.settings.currencies.colStatus")}</span>
          <span className="text-right">
            {t("admin.settings.currencies.colOperation")}
          </span>
        </div>
        {loading ? (
          <div className="h-32 animate-pulse bg-light-border/30 dark:bg-dark-border/30" />
        ) : currencies.length > 0 ? (
          currencies.map((currency) => (
            <div
              key={currency.code}
              className="grid grid-cols-[0.8fr_1.4fr_0.8fr_0.8fr_1fr] items-center gap-3 border-b border-light-border px-4 py-3 text-sm last:border-b-0 dark:border-dark-border"
            >
              <span className="font-semibold text-light-text dark:text-dark-text">
                {currency.code}
              </span>
              <span className="text-light-text dark:text-dark-text">
                {currency.name}
                {currency.isBase ? (
                  <span className="ms-2 border border-primary-500/30 bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
                    {t("admin.settings.common.base")}
                  </span>
                ) : null}
              </span>
              <span>{currency.symbol}</span>
              <span>
                {currency.isActive
                  ? t("admin.settings.common.active")
                  : t("admin.settings.common.inactive")}
              </span>
              <span className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCurrency(currency)}
                  className="inline-flex items-center gap-1.5 border border-light-border bg-light-bg px-2.5 py-1.5 text-xs font-semibold text-light-text transition hover:border-primary-500 hover:text-primary-600 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:hover:text-primary-500"
                >
                  <Edit3 className="size-3.5" aria-hidden="true" />
                  {t("admin.settings.common.update")}
                </button>
                <button
                  type="button"
                  disabled={currency.isBase || deletingCode === currency.code}
                  onClick={() => void handleDelete(currency)}
                  className="inline-flex items-center gap-1.5 border border-light-border bg-light-bg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:bg-dark-bg dark:text-red-400"
                >
                  {deletingCode === currency.code ? (
                    <LoaderMini size={14} color="currentColor" />
                  ) : (
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  )}
                  {t("admin.settings.common.delete")}
                </button>
              </span>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted">
            {t("admin.settings.currencies.empty")}
          </div>
        )}
      </section>
    </div>
  );
}

function RolesSettingsContent({
  hideHeader = false,
}: {
  hideHeader?: boolean;
}) {
  const { t } = useI18n();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<RoleRow | null | undefined>();
  const [editingPermission, setEditingPermission] = useState<
    PermissionRow | null | undefined
  >();

  async function load() {
    setLoading(true);
    try {
      const [nextRoles, nextPermissions] = await Promise.all([
        fetchRoles(),
        fetchPermissions(),
      ]);
      setRoles(nextRoles);
      setPermissions(nextPermissions);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : t("admin.settings.roles.loadFailedFallback");
      gooeyToast.error(t("admin.settings.roles.loadFailedTitle"), {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-2">
      <RoleEditor
        open={editingRole !== undefined}
        role={editingRole}
        permissions={permissions}
        onCancel={() => setEditingRole(undefined)}
        onSaved={() => {
          setEditingRole(undefined);
          void load();
        }}
      />
      <PermissionEditor
        open={editingPermission !== undefined}
        permission={editingPermission}
        onCancel={() => setEditingPermission(undefined)}
        onSaved={() => {
          setEditingPermission(undefined);
          void load();
        }}
      />

      {!hideHeader ? (
        <AdminPageHeader
          eyebrow={t("admin.settings.common.eyebrow")}
          title={t("admin.settings.roles.pageTitle")}
          description={t("admin.settings.roles.pageDescription")}
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditingPermission(null)}
                className="inline-flex items-center gap-2 border border-light-border bg-light-bg px-4 py-2.5 text-sm font-semibold text-light-text transition hover:border-primary-500 hover:text-primary-600 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:hover:text-primary-500"
              >
                <Plus className="size-4" aria-hidden="true" />
                {t("admin.settings.roles.addPermission")}
              </button>
              <button
                type="button"
                onClick={() => setEditingRole(null)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="size-4" aria-hidden="true" />
                {t("admin.settings.roles.addRole")}
              </button>
            </div>
          }
        />
      ) : null}

      {loading ? (
        <div className="h-48 animate-pulse border border-light-border bg-light-border/40 dark:border-dark-border dark:bg-dark-border/40" />
      ) : (
        <div className="grid gap-2">
          <SettingsPanel
            title={t("admin.settings.roles.panelTitle")}
            description={t("admin.settings.roles.panelDescription")}
          >
            {roles.map((role) => (
              <div
                key={role.id}
                className="border-b border-light-border px-4 py-4 last:border-b-0 dark:border-dark-border"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-light-text dark:text-dark-text">
                      {role.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {role.description ||
                        t("admin.settings.common.noDescription")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingRole(role)}
                    className="inline-flex items-center gap-2 border border-light-border bg-light-bg px-3 py-2 text-sm font-semibold text-light-text transition hover:border-primary-500 hover:text-primary-600 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:hover:text-primary-500"
                  >
                    <Edit3 className="size-4" aria-hidden="true" />
                    {t("admin.settings.common.edit")}
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {role.permissions.length > 0 ? (
                    role.permissions.map((permission) => (
                      <span
                        key={`${role.id}-${permission.key}`}
                        className={
                          permission.effect === "allow"
                            ? "border border-emerald-500/30 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "border border-red-500/30 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300"
                        }
                      >
                        {permission.effect === "allow"
                          ? t("admin.settings.common.allow")
                          : t("admin.settings.common.deny")}
                        : {permission.key}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted">
                      {t("admin.settings.roles.noneAssigned")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </SettingsPanel>

          <SettingsPanel
            title={t("admin.settings.roles.permissionsPanelTitle")}
            description={t("admin.settings.roles.permissionsPanelDescription")}
          >
            {permissions.map((permission) => (
              <SettingsRow
                key={permission.id}
                label={permission.key}
                description={
                  permission.description ??
                  t("admin.settings.common.noDescription")
                }
              >
                <button
                  type="button"
                  onClick={() => setEditingPermission(permission)}
                  className="inline-flex items-center gap-2 border border-light-border bg-light-bg px-3 py-2 text-sm font-semibold text-light-text transition hover:border-primary-500 hover:text-primary-600 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:hover:text-primary-500"
                >
                  <Edit3 className="size-4" aria-hidden="true" />
                  {t("admin.settings.common.edit")}
                </button>
              </SettingsRow>
            ))}
          </SettingsPanel>
        </div>
      )}
    </div>
  );
}

function BackupSettingsContent({ hideHeader }: { hideHeader: boolean }) {
  const { language, t } = useI18n();
  const [creating, setCreating] = useState(false);
  const [schedule, setSchedule] = useState<BackupScheduleResult | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [frequency, setFrequency] = useState<BackupFrequency>("daily");
  const [backupPath, setBackupPath] = useState("automatic");
  const [deviceDirectory, setDeviceDirectory] =
    useState<BackupDirectoryHandle | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [lastBackup, setLastBackup] = useState<{
    filename: string;
    createdAt: string;
    tableCount: number;
    recordCount: number;
    size: number;
  } | null>(null);

  useEffect(() => {
    void fetchBackupSchedule()
      .then((result) => {
        setSchedule(result);
        setScheduleEnabled(result.schedule.enabled);
        setFrequency(result.schedule.frequency);
        setBackupPath(result.schedule.path);
      })
      .catch(() => undefined);
  }, []);

  async function chooseDeviceDirectory() {
    const picker = (
      window as typeof window & {
        showDirectoryPicker?: (options?: {
          mode?: "readwrite";
        }) => Promise<BackupDirectoryHandle>;
      }
    ).showDirectoryPicker;
    if (!picker) {
      gooeyToast.error(t("admin.settings.backup.folderPickerUnsupported"));
      return null;
    }
    try {
      const directory = await picker({ mode: "readwrite" });
      setDeviceDirectory(directory);
      return directory;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError")
        return null;
      throw error;
    }
  }

  async function handleSaveSchedule(overrides?: {
    enabled?: boolean;
    frequency?: BackupFrequency;
  }) {
    setSavingSchedule(true);
    try {
      const result = await saveBackupSchedule({
        enabled: overrides?.enabled ?? scheduleEnabled,
        frequency: overrides?.frequency ?? frequency,
        path: backupPath,
      });
      setSchedule(result);
      setScheduleEnabled(result.schedule.enabled);
      setFrequency(result.schedule.frequency);
      gooeyToast.success(t("admin.settings.backup.scheduleSaved"));
    } catch (error) {
      if (schedule) {
        setScheduleEnabled(schedule.schedule.enabled);
        setFrequency(schedule.schedule.frequency);
      }
      gooeyToast.error(
        error instanceof ApiError
          ? error.message
          : t("admin.settings.backup.errorDescription"),
      );
    } finally {
      setSavingSchedule(false);
    }
  }

  async function handleBackup() {
    try {
      const directory = deviceDirectory ?? (await chooseDeviceDirectory());
      if (!directory && "showDirectoryPicker" in window) return;
      setCreating(true);
      const result = await downloadDatabaseBackup();
      if (directory) {
        const file = await directory.getFileHandle(result.filename, {
          create: true,
        });
        const writable = await file.createWritable();
        await writable.write(result.blob);
        await writable.close();
      } else {
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }
      setLastBackup(result);
      gooeyToast.success(t("admin.settings.backup.successTitle"), {
        description: t("admin.settings.backup.successDescription"),
      });
    } catch (error) {
      gooeyToast.error(t("admin.settings.backup.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.settings.backup.errorDescription"),
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-2">
      {!hideHeader ? (
        <AdminPageHeader
          eyebrow={t("admin.settings.common.eyebrow")}
          title={t("admin.settings.section.backup.label")}
          description={t("admin.settings.section.backup.description")}
        />
      ) : null}
      <SettingsPanel
        title={t("admin.settings.backup.panelTitle")}
        description={t("admin.settings.backup.panelDescription")}
      >
        <SettingsRow
          label={t("admin.settings.backup.automaticLabel")}
          description={t("admin.settings.backup.automaticDescription")}
        >
          <ToggleSwitch
            id="automatic-backup"
            checked={scheduleEnabled}
            disabled={savingSchedule}
            onCheckedChange={(enabled) => {
              setScheduleEnabled(enabled);
              void handleSaveSchedule({ enabled });
            }}
            aria-label={t("admin.settings.backup.automaticLabel")}
          />
        </SettingsRow>
        <SettingsRow
          label={t("admin.settings.backup.frequencyLabel")}
          description={t("admin.settings.backup.frequencyDescription")}
        >
          <div className="w-full sm:w-56">
            <SelectField
              tone="light"
              disabled={savingSchedule}
              value={frequency}
              onValueChange={(value) => {
                const nextFrequency = value as BackupFrequency;
                setFrequency(nextFrequency);
                void handleSaveSchedule({ frequency: nextFrequency });
              }}
              options={[
                { value: "hourly", label: t("admin.settings.backup.hourly") },
                { value: "daily", label: t("admin.settings.backup.daily") },
                { value: "weekly", label: t("admin.settings.backup.weekly") },
              ]}
            />
          </div>
        </SettingsRow>
        <SettingsRow
          label={t("admin.settings.backup.pathLabel")}
          description={t("admin.settings.backup.pathDescription")}
        >
          <div className="flex flex-wrap items-center justify-end gap-2">
            {deviceDirectory ? (
              <span className="text-sm font-semibold text-light-text dark:text-dark-text">
                {deviceDirectory.name}
              </span>
            ) : null}
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-2"
              onClick={() => void chooseDeviceDirectory()}
            >
              <FolderOpen className="size-4" aria-hidden="true" />
              {t("admin.settings.backup.chooseDirectory")}
            </button>
          </div>
        </SettingsRow>
        <SettingsRow
          label={t("admin.settings.backup.scheduleActions")}
          description={
            schedule?.schedule.lastError ??
            (schedule?.schedule.nextRunAt
              ? `${t("admin.settings.backup.nextRun")}: ${new Date(schedule.schedule.nextRunAt).toLocaleString(language === "en" ? "en-US" : language)}`
              : t("admin.settings.backup.scheduleActionsDescription"))
          }
        >
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              disabled={savingSchedule || !backupPath.trim()}
              onClick={() => void handleSaveSchedule()}
            >
              {savingSchedule ? <LoaderMini /> : <Save className="size-4" />}{" "}
              {t("admin.settings.backup.saveSchedule")}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={creating}
              onClick={() => void handleBackup()}
            >
              {creating ? (
                <LoaderMini />
              ) : (
                <DatabaseBackup className="size-4" />
              )}{" "}
              {t("admin.settings.backup.runNow")}
            </button>
          </div>
        </SettingsRow>
        <SettingsRow
          label={t("admin.settings.backup.databaseLabel")}
          description={t("admin.settings.backup.databaseDescription")}
        >
          <button
            type="button"
            disabled={creating}
            onClick={() => void handleBackup()}
            className="btn-primary inline-flex min-h-10 items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? (
              <LoaderMini />
            ) : (
              <Download className="size-4" aria-hidden="true" />
            )}
            {creating
              ? t("admin.settings.backup.creating")
              : t("admin.settings.backup.download")}
          </button>
        </SettingsRow>
        <SettingsRow
          label={t("admin.settings.backup.securityLabel")}
          description={t("admin.settings.backup.securityDescription")}
        >
          <DatabaseBackup
            className="size-6 text-primary-600 dark:text-primary-400"
            aria-hidden="true"
          />
        </SettingsRow>
        {lastBackup ? (
          <SettingsRow
            label={t("admin.settings.backup.lastBackup")}
            description={lastBackup.filename}
          >
            <span className="text-end text-xs font-semibold text-light-text dark:text-dark-text">
              <span className="block">
                {new Date(lastBackup.createdAt).toLocaleString(
                  language === "en" ? "en-US" : language,
                )}
              </span>
              <span className="mt-1 block text-light-muted dark:text-dark-muted">
                {t("admin.settings.backup.summary", {
                  tables: formatAdminNumber(lastBackup.tableCount, language),
                  records: formatAdminNumber(lastBackup.recordCount, language),
                  size: formatAdminNumber(lastBackup.size / 1024, language),
                })}
              </span>
            </span>
          </SettingsRow>
        ) : null}
      </SettingsPanel>
    </div>
  );
}

export function AdminSettingsSectionContent({
  sectionId,
  hideHeader = false,
}: AdminSettingsSectionContentProps) {
  const { t } = useI18n();
  const section = getAdminSettingsSection(sectionId);
  const [values, setValues] = useState<AdminSettingsValues>({});
  const [savedValues, setSavedValues] = useState<AdminSettingsValues>({});
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const defaults = useMemo(() => getAdminSettings(), []);

  useEffect(() => {
    let cancelled = false;

    async function loadValues() {
      setReady(false);
      try {
        const next =
          sectionId === "general"
            ? buildStoreValues(await fetchStoreSettings())
            : getAdminSettings();
        if (cancelled) return;
        setValues(next);
        setSavedValues(next);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Could not load settings from backend.";
        gooeyToast.error("Settings unavailable", { description: message });
        const fallback = getAdminSettings();
        setValues(fallback);
        setSavedValues(fallback);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    if (sectionId !== "roles") {
      void loadValues();
      setEditing(false);
      setLogoFile(null);
    }

    return () => {
      cancelled = true;
    };
  }, [sectionId]);

  if (sectionId === "roles") {
    return <RolesSettingsContent hideHeader={hideHeader} />;
  }

  if (sectionId === "currencies") {
    return <CurrenciesSettingsContent hideHeader={hideHeader} />;
  }

  if (sectionId === "expense-categories") {
    return <ExpenseCategoriesSettingsContent hideHeader={hideHeader} />;
  }

  if (sectionId === "backup") {
    return <BackupSettingsContent hideHeader={hideHeader} />;
  }

  if (!section) return null;

  if (sectionId !== "general") {
    return (
      <div className="space-y-2">
        {!hideHeader ? (
          <AdminPageHeader
            eyebrow={t("admin.settings.common.eyebrow")}
            title={t(section.labelKey)}
            description={t(section.descriptionKey)}
          />
        ) : null}
        <SettingsPanel
          title={t("admin.settings.pending.title")}
          description={t("admin.settings.pending.description")}
        >
          <SettingsRow
            label={t("admin.settings.pending.status")}
            description={t("admin.settings.pending.statusDescription")}
          >
            <span className="border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
              {t("admin.settings.pending.badge")}
            </span>
          </SettingsRow>
        </SettingsPanel>
      </div>
    );
  }

  const sectionLabel = t(section.labelKey);

  function updateField(field: AdminSettingsField, raw: EditableValue) {
    setValues((current) => ({
      ...current,
      [field.key]: coerceFieldValue(field, raw),
    }));
  }

  function handleCancel() {
    setValues(savedValues);
    setLogoFile(null);
    setEditing(false);
  }

  function handleReset() {
    setValues(defaults);
    setLogoFile(null);
    gooeyToast.success("Changes discarded", {
      description: "Restored the last saved values for this section.",
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (sectionId === "general") {
        const input: Record<string, string | File> = {};
        for (const [fieldKey, apiKey] of Object.entries(settingKeyMap)) {
          if (apiKey === "logoUrl") continue;
          const value = values[fieldKey];
          if (value !== undefined && String(value).trim()) {
            input[apiKey] = String(value);
          }
        }
        if (logoFile) input.logo = logoFile;
        const settings = await updateStoreSettings(input);
        const next = buildStoreValues(settings);
        setValues(next);
        setSavedValues(next);
      } else {
        const merged = { ...getAdminSettings(), ...values };
        saveAdminSettings(merged);
        setSavedValues(values);
      }

      setEditing(false);
      setLogoFile(null);
      gooeyToast.success("Settings saved", {
        description: `${sectionLabel} settings were saved.`,
      });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Could not save settings.";
      gooeyToast.error("Save failed", { description: message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      {!hideHeader ? (
        <AdminPageHeader
          eyebrow="Settings"
          title={t(section.labelKey)}
          description={t(section.descriptionKey)}
          actions={
            editing ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {saving ? (
                    <LoaderMini size={16} color="currentColor" />
                  ) : (
                    <Save className="size-4" aria-hidden="true" />
                  )}
                  {saving ? "Saving" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="border border-light-border bg-light-bg px-4 py-2.5 text-sm font-semibold text-light-text dark:border-dark-border dark:bg-dark-bg dark:text-dark-text"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Edit3 className="size-4" aria-hidden="true" />
                Edit
              </button>
            )
          }
        />
      ) : null}

      {!ready ? (
        <div className="h-48 animate-pulse border border-light-border bg-light-border/40 dark:border-dark-border dark:bg-dark-border/40" />
      ) : (
        <>
          {section.groups.map((group) => (
            <SettingsPanel
              key={group.titleKey}
              title={t(group.titleKey)}
              description={
                group.descriptionKey ? t(group.descriptionKey) : undefined
              }
            >
              {group.fields.map((field) => {
                const value = getFieldValue(values, field);
                return (
                  <SettingsRow
                    key={field.key}
                    label={t(field.labelKey)}
                    description={
                      field.descriptionKey ? t(field.descriptionKey) : undefined
                    }
                    stackOnMobile={editing && field.type !== "toggle"}
                  >
                    {editing ? (
                      <SettingsFieldControl
                        field={field}
                        value={value}
                        onChange={(next) => updateField(field, next)}
                        onImageFile={
                          field.type === "image" ? setLogoFile : undefined
                        }
                      />
                    ) : (
                      <SettingsFieldDisplay field={field} value={value} />
                    )}
                  </SettingsRow>
                );
              })}
            </SettingsPanel>
          ))}

          {editing ? (
            <div className="sticky bottom-0 z-10 flex flex-wrap gap-3 border border-light-border bg-light-surface/95 p-4 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.08)] backdrop-blur-sm dark:border-dark-border dark:bg-dark-surface/95 dark:shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.35)]">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary inline-flex items-center gap-2"
              >
                {saving ? (
                  <LoaderMini size={16} color="currentColor" />
                ) : (
                  <Save className="size-4" aria-hidden="true" />
                )}
                <span>{saving ? "Saving" : "Save changes"}</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 border border-light-border bg-light-bg px-4 py-2.5 text-sm font-semibold text-light-text transition hover:border-primary-500/40 hover:bg-primary-50/50 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:hover:border-primary-500/40 dark:hover:bg-primary-500/5"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Reset
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

import type { LucideIcon } from "lucide-react";
import {
  DatabaseBackup,
  Globe,
  KeyRound,
  Landmark,
  ShieldCheck,
  Store,
  UserRound,
  Users,
} from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

export type AdminSettingsFieldType =
  | "text"
  | "email"
  | "tel"
  | "url"
  | "number"
  | "textarea"
  | "select"
  | "toggle"
  | "password"
  | "image";

export type AdminSettingsFieldOption = {
  value: string;
  labelKey: TranslationKey;
};

export type AdminSettingsField = {
  key: string;
  labelKey: TranslationKey;
  descriptionKey?: TranslationKey;
  type: AdminSettingsFieldType;
  defaultValue?: string | number | boolean;
  placeholderKey?: TranslationKey;
  options?: AdminSettingsFieldOption[];
  min?: number;
  max?: number;
};

export type AdminSettingsGroup = {
  titleKey: TranslationKey;
  descriptionKey?: TranslationKey;
  fields: AdminSettingsField[];
};

export type AdminSettingsSectionId =
  | "general"
  | "profile"
  | "users"
  | "currencies"
  | "expense-categories"
  | "roles"
  | "sales"
  | "reports"
  | "notifications"
  | "security"
  | "backup";

export type AdminSettingsSection = {
  id: AdminSettingsSectionId;
  labelKey: TranslationKey;
  icon: LucideIcon;
  descriptionKey: TranslationKey;
  mvp?: boolean;
  groups: AdminSettingsGroup[];
};

const timezoneOptions: AdminSettingsFieldOption[] = [
  { value: "Asia/Kabul", labelKey: "admin.settings.option.timezone.asiaKabul" },
  { value: "UTC", labelKey: "admin.settings.option.timezone.utc" },
];

const languageOptions: AdminSettingsFieldOption[] = [
  { value: "en", labelKey: "admin.settings.option.language.en" },
  { value: "fa", labelKey: "admin.settings.option.language.fa" },
  { value: "ps", labelKey: "admin.settings.option.language.ps" },
];

const currencyOptions: AdminSettingsFieldOption[] = [
  { value: "AFN", labelKey: "admin.settings.option.currency.afn" },
  { value: "USD", labelKey: "admin.settings.option.currency.usd" },
  { value: "PKR", labelKey: "admin.settings.option.currency.pkr" },
];

const permissionOptions: AdminSettingsFieldOption[] = [
  {
    value: "admin_only",
    labelKey: "admin.settings.option.permission.adminOnly",
  },
  {
    value: "admin_manager",
    labelKey: "admin.settings.option.permission.adminManager",
  },
  { value: "none", labelKey: "admin.settings.option.permission.none" },
];

const dateFormatOptions: AdminSettingsFieldOption[] = [
  {
    value: "YYYY-MM-DD",
    labelKey: "admin.settings.option.dateFormat.ymd",
  },
  {
    value: "DD/MM/YYYY",
    labelKey: "admin.settings.option.dateFormat.dmy",
  },
];

const rateSourceOptions: AdminSettingsFieldOption[] = [
  { value: "manual", labelKey: "admin.settings.option.rateSource.manual" },
  { value: "daily", labelKey: "admin.settings.option.rateSource.daily" },
];

export const ADMIN_SETTINGS_SECTIONS: AdminSettingsSection[] = [
  {
    id: "general",
    labelKey: "admin.settings.section.general.label",
    icon: Store,
    descriptionKey: "admin.settings.section.general.description",
    mvp: true,
    groups: [
      {
        titleKey: "admin.settings.group.general.identity.title",
        fields: [
          {
            key: "general.storeName",
            labelKey: "admin.settings.field.general.storeName",
            type: "text",
            defaultValue: "Battery Store",
          },
          {
            key: "general.logo",
            labelKey: "admin.settings.field.general.logo",
            type: "image",
            descriptionKey: "admin.settings.field.general.logoDescription",
          },
          {
            key: "general.receiptTitle",
            labelKey: "admin.settings.field.general.receiptTitle",
            type: "text",
            defaultValue: "Battery Store",
          },
          {
            key: "general.taxId",
            labelKey: "admin.settings.field.general.taxId",
            type: "text",
          },
        ],
      },
      {
        titleKey: "admin.settings.group.general.contact.title",
        fields: [
          {
            key: "general.contactPhone",
            labelKey: "admin.settings.field.general.contactPhone",
            type: "tel",
            defaultValue: "+93 700 000 000",
          },
          {
            key: "general.contactEmail",
            labelKey: "admin.settings.field.general.contactEmail",
            type: "email",
            defaultValue: "contact@store.local",
          },
          {
            key: "general.address",
            labelKey: "admin.settings.field.general.address",
            type: "textarea",
            defaultValue: "Kabul, Afghanistan",
          },
        ],
      },
      {
        titleKey: "admin.settings.group.general.locale.title",
        fields: [
          {
            key: "general.timezone",
            labelKey: "admin.settings.field.general.timezone",
            type: "select",
            defaultValue: "Asia/Kabul",
            options: timezoneOptions,
          },
          {
            key: "general.defaultLanguage",
            labelKey: "admin.settings.field.general.defaultLanguage",
            type: "select",
            defaultValue: "en",
            options: languageOptions,
          },
          {
            key: "general.dateFormat",
            labelKey: "admin.settings.field.general.dateFormat",
            type: "select",
            defaultValue: "YYYY-MM-DD",
            options: dateFormatOptions,
          },
        ],
      },
    ],
  },
  {
    id: "profile",
    labelKey: "admin.settings.section.profile.label",
    icon: UserRound,
    descriptionKey: "admin.settings.section.profile.description",
    mvp: true,
    groups: [],
  },
  {
    id: "users",
    labelKey: "admin.settings.section.users.label",
    icon: Users,
    descriptionKey: "admin.settings.section.users.description",
    mvp: true,
    groups: [],
  },
  {
    id: "currencies",
    labelKey: "admin.settings.section.currencies.label",
    icon: Globe,
    descriptionKey: "admin.settings.section.currencies.description",
    mvp: true,
    groups: [
      {
        titleKey: "admin.settings.group.currencies.main.title",
        fields: [
          {
            key: "currencies.baseCurrency",
            labelKey: "admin.settings.field.currencies.baseCurrency",
            type: "select",
            defaultValue: "AFN",
            options: currencyOptions,
          },
          {
            key: "currencies.allowMultiCurrencySales",
            labelKey: "admin.settings.field.currencies.allowMultiCurrencySales",
            type: "toggle",
            defaultValue: true,
          },
          {
            key: "currencies.allowMultiCurrencyPurchases",
            labelKey:
              "admin.settings.field.currencies.allowMultiCurrencyPurchases",
            type: "toggle",
            defaultValue: true,
          },
        ],
      },
      {
        titleKey: "admin.settings.group.currencies.rates.title",
        descriptionKey: "admin.settings.group.currencies.rates.description",
        fields: [
          {
            key: "currencies.usdToAfn",
            labelKey: "admin.settings.field.currencies.usdToAfn",
            type: "number",
            defaultValue: 70,
            min: 1,
          },
          {
            key: "currencies.pkrToAfn",
            labelKey: "admin.settings.field.currencies.pkrToAfn",
            type: "number",
            defaultValue: 0.25,
            min: 0,
          },
          {
            key: "currencies.rateSource",
            labelKey: "admin.settings.field.currencies.rateSource",
            type: "select",
            defaultValue: "manual",
            options: rateSourceOptions,
          },
        ],
      },
    ],
  },
  {
    id: "expense-categories",
    labelKey: "admin.settings.section.expenseCategories.label",
    icon: Landmark,
    descriptionKey: "admin.settings.section.expenseCategories.description",
    mvp: true,
    groups: [],
  },
  {
    id: "roles",
    labelKey: "admin.settings.section.roles.label",
    icon: ShieldCheck,
    descriptionKey: "admin.settings.section.roles.description",
    mvp: true,
    groups: [
      {
        titleKey: "admin.settings.group.roles.access.title",
        fields: [
          {
            key: "roles.managerCanViewAccounts",
            labelKey: "admin.settings.field.roles.managerCanViewAccounts",
            type: "toggle",
            defaultValue: true,
          },
          {
            key: "roles.managerCanViewReports",
            labelKey: "admin.settings.field.roles.managerCanViewReports",
            type: "toggle",
            defaultValue: true,
          },
          {
            key: "roles.managerCanManageProducts",
            labelKey: "admin.settings.field.roles.managerCanManageProducts",
            type: "toggle",
            defaultValue: true,
          },
          {
            key: "roles.managerCanManagePartners",
            labelKey: "admin.settings.field.roles.managerCanManagePartners",
            type: "toggle",
            defaultValue: true,
          },
        ],
      },
      {
        titleKey: "admin.settings.group.roles.actions.title",
        descriptionKey: "admin.settings.group.roles.actions.description",
        fields: [
          {
            key: "roles.createRows",
            labelKey: "admin.settings.field.roles.createRows",
            type: "select",
            defaultValue: "admin_manager",
            options: permissionOptions,
          },
          {
            key: "roles.editRows",
            labelKey: "admin.settings.field.roles.editRows",
            type: "select",
            defaultValue: "admin_manager",
            options: permissionOptions,
          },
          {
            key: "roles.deleteRows",
            labelKey: "admin.settings.field.roles.deleteRows",
            type: "select",
            defaultValue: "admin_only",
            options: permissionOptions,
          },
          {
            key: "roles.approveTransactions",
            labelKey: "admin.settings.field.roles.approveTransactions",
            type: "select",
            defaultValue: "admin_only",
            options: permissionOptions,
          },
        ],
      },
      {
        titleKey: "admin.settings.group.roles.money.title",
        fields: [
          {
            key: "roles.managerCanCreateTransfers",
            labelKey: "admin.settings.field.roles.managerCanCreateTransfers",
            type: "toggle",
            defaultValue: true,
          },
          {
            key: "roles.managerCanDeleteJournals",
            labelKey: "admin.settings.field.roles.managerCanDeleteJournals",
            type: "toggle",
            defaultValue: false,
          },
          {
            key: "roles.managerCanChangeExchangeRates",
            labelKey:
              "admin.settings.field.roles.managerCanChangeExchangeRates",
            type: "toggle",
            defaultValue: false,
          },
        ],
      },
    ],
  },
  {
    id: "security",
    labelKey: "admin.settings.section.security.label",
    icon: KeyRound,
    descriptionKey: "admin.settings.section.security.description",
    mvp: true,
    groups: [
      {
        titleKey: "admin.settings.group.security.auth.title",
        fields: [
          {
            key: "security.minPasswordLength",
            labelKey: "admin.settings.field.security.minPasswordLength",
            type: "number",
            defaultValue: 8,
            min: 6,
            max: 128,
          },
          {
            key: "security.requireUppercase",
            labelKey: "admin.settings.field.security.requireUppercase",
            type: "toggle",
            defaultValue: false,
          },
          {
            key: "security.sessionDurationHours",
            labelKey: "admin.settings.field.security.sessionDurationHours",
            type: "number",
            defaultValue: 168,
            min: 1,
          },
        ],
      },
      {
        titleKey: "admin.settings.group.security.audit.title",
        fields: [
          {
            key: "security.auditLogsEnabled",
            labelKey: "admin.settings.field.security.auditLogsEnabled",
            type: "toggle",
            defaultValue: true,
          },
          {
            key: "security.logDeletes",
            labelKey: "admin.settings.field.security.logDeletes",
            type: "toggle",
            defaultValue: true,
          },
          {
            key: "security.logMoneyMovement",
            labelKey: "admin.settings.field.security.logMoneyMovement",
            type: "toggle",
            defaultValue: true,
          },
        ],
      },
    ],
  },
  {
    id: "backup",
    labelKey: "admin.settings.section.backup.label",
    icon: DatabaseBackup,
    descriptionKey: "admin.settings.section.backup.description",
    mvp: true,
    groups: [],
  },
];

export const ADMIN_SETTINGS_SECTION_IDS = ADMIN_SETTINGS_SECTIONS.map(
  (section) => section.id,
);

export const ADMIN_SETTINGS_MVP_SECTIONS = ADMIN_SETTINGS_SECTIONS.filter(
  (section) => section.mvp,
);

export function isAdminSettingsSectionId(
  value: string,
): value is AdminSettingsSectionId {
  return ADMIN_SETTINGS_SECTION_IDS.includes(value as AdminSettingsSectionId);
}

export function getAdminSettingsSection(
  id: AdminSettingsSectionId,
): AdminSettingsSection | undefined {
  return ADMIN_SETTINGS_SECTIONS.find((section) => section.id === id);
}

export function buildAdminSettingsDefaults(): Record<
  string,
  string | number | boolean
> {
  const defaults: Record<string, string | number | boolean> = {};
  for (const section of ADMIN_SETTINGS_SECTIONS) {
    for (const group of section.groups) {
      for (const field of group.fields) {
        if (field.defaultValue !== undefined) {
          defaults[field.key] = field.defaultValue;
        } else if (field.type === "toggle") {
          defaults[field.key] = false;
        } else {
          defaults[field.key] = "";
        }
      }
    }
  }
  return defaults;
}

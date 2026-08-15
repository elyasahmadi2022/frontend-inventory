"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { SelectField } from "@/components/common";
import { ToggleSwitch } from "@/components/common/toggle-switch";
import { SettingsFieldBlock, SettingsRow } from "@/components/dashboard/settings-ui";
import { useI18n } from "@/lib/i18n";
import {
  appLanguages,
  getStoredLanguage,
  getStoredTheme,
  setStoredLanguage,
  setStoredTheme,
  subscribeToUserPreferences,
  type AppLanguage,
  type AppTheme,
} from "@/lib/user-preferences";

type DashboardPreferencesFormProps = {
  layout?: "stack" | "settings";
};

export function DashboardPreferencesForm({
  layout = "stack",
}: DashboardPreferencesFormProps) {
  const { t } = useI18n();
  const language = useSyncExternalStore<AppLanguage>(
    subscribeToUserPreferences,
    getStoredLanguage,
    () => "en",
  );
  const theme = useSyncExternalStore<AppTheme>(
    subscribeToUserPreferences,
    getStoredTheme,
    () => "light",
  );

  const languageOptions = useMemo(
    () =>
      appLanguages.map((option) => ({
        value: option.value,
        label: option.labels[language],
        searchText: Object.values(option.labels).join(" "),
      })),
    [language],
  );

  const languageControl = (
    <SelectField
      label={layout === "stack" ? t("preferences.language") : undefined}
      value={language}
      onChange={(value) => setStoredLanguage(value as AppLanguage)}
      options={languageOptions}
      tone="light"
      searchable
      placeholder={t("dashboard.settings.languagePlaceholder")}
    />
  );

  const themeControl = (
    <div className="flex items-center gap-3">
      <Sun
        className={`size-4 ${theme === "light" ? "text-primary-600 dark:text-primary-500" : "text-light-muted dark:text-dark-muted"}`}
        aria-hidden="true"
      />
      <ToggleSwitch
        id="dashboard-theme-toggle"
        checked={theme === "dark"}
        onCheckedChange={(checked) =>
          setStoredTheme(checked ? "dark" : "light")
        }
        aria-label={t("preferences.appearance")}
      />
      <Moon
        className={`size-4 ${theme === "dark" ? "text-primary-600 dark:text-primary-500" : "text-light-muted dark:text-dark-muted"}`}
        aria-hidden="true"
      />
    </div>
  );

  if (layout === "settings") {
    return (
      <>
        <SettingsFieldBlock
          label={t("preferences.language")}
          description={t("dashboard.settings.languageRowDescription")}
        >
          {languageControl}
        </SettingsFieldBlock>
        <SettingsRow
          label={t("preferences.appearance")}
          description={t("dashboard.settings.themeRowDescription")}
        >
          {themeControl}
        </SettingsRow>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div>{languageControl}</div>
      <div>
        <p className="mb-3 text-sm font-medium text-light-text dark:text-dark-text">
          {t("preferences.appearance")}
        </p>
        {themeControl}
      </div>
    </div>
  );
}

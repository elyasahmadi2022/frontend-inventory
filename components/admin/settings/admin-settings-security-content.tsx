"use client";

import { gooeyToast } from "goey-toast";
import { useState } from "react";
import { KeyRound, LogOut } from "lucide-react";
import { AdminSettingsSectionContent } from "@/components/admin/settings/admin-settings-section-content";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { InputField } from "@/components/common";
import { LoaderMini } from "@/components/common/loader-mini";
import { SettingsPanel, SettingsRow } from "@/components/dashboard/settings-ui";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { ADMIN_SETTINGS_FIELD_TONE } from "@/lib/admin/admin-settings-input-styles";
import { useI18n } from "@/lib/i18n";
import { appRoutes } from "@/routes/app-routes";
import { changePassword } from "@/services/profile.service";

const sectionClass =
  "border border-light-border bg-light-surface p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface dark:shadow-dark-xs sm:p-6";

export function AdminSettingsSecurityContent() {
  const { t } = useI18n();
  const { signOut } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      gooeyToast.error(t("admin.settings.security.missingTitle"), {
        description: t("admin.settings.security.missingDescription"),
      });
      return;
    }
    if (newPassword.length < 8) {
      gooeyToast.error(t("admin.settings.security.weakTitle"), {
        description: t("admin.settings.security.weakDescription"),
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      gooeyToast.error(t("admin.settings.security.mismatchTitle"), {
        description: t("admin.settings.security.mismatchDescription"),
      });
      return;
    }

    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      gooeyToast.success(t("admin.settings.security.successTitle"), {
        description: t("admin.settings.security.successDescription"),
      });
    } catch (error) {
      gooeyToast.error(t("admin.settings.security.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.settings.security.errorFallback"),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        eyebrow={t("admin.settings.security.eyebrow")}
        title={t("admin.settings.security.title")}
        description={t("admin.settings.security.description")}
      />

      <form onSubmit={onSubmit} className={`${sectionClass} space-y-5`}>
        <div className="flex items-start gap-4">
          <span className="inline-flex size-11 shrink-0 items-center justify-center border border-light-border bg-light-bg text-primary-600 dark:border-dark-border dark:bg-dark-bg dark:text-primary-500">
            <KeyRound className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-light-text dark:text-dark-text">
              {t("admin.settings.security.passwordTitle")}
            </h2>
            <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
              {t("admin.settings.security.passwordDescription")}
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t border-light-border pt-5 dark:border-dark-border">
          <InputField
            type="password"
            label={t("admin.settings.security.currentPassword")}
            value={currentPassword}
            tone={ADMIN_SETTINGS_FIELD_TONE}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t(
              "admin.settings.security.currentPasswordPlaceholder",
            )}
            autoComplete="current-password"
          />

          <InputField
            type="password"
            label={t("admin.settings.security.newPassword")}
            value={newPassword}
            tone={ADMIN_SETTINGS_FIELD_TONE}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t("admin.settings.security.newPasswordPlaceholder")}
            autoComplete="new-password"
          />

          <InputField
            type="password"
            label={t("admin.settings.security.confirmPassword")}
            value={confirmPassword}
            tone={ADMIN_SETTINGS_FIELD_TONE}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t(
              "admin.settings.security.confirmPasswordPlaceholder",
            )}
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full gap-2 sm:w-auto"
          >
            {saving ? (
              <>
                <LoaderMini size={16} color="currentColor" />
                <span>{t("admin.settings.security.submitting")}</span>
              </>
            ) : (
              t("admin.settings.security.submit")
            )}
          </button>
        </div>
      </form>

      <SettingsPanel
        title="Session"
        description="Manage the current admin session from the admin security area."
      >
        <SettingsRow
          label={t("auth.logout")}
          description="Sign out of this browser and return to the login page."
        >
          <button
            type="button"
            onClick={() => void signOut({ redirectTo: appRoutes.login })}
            className="inline-flex items-center gap-2 border border-light-border bg-light-bg px-4 py-2.5 text-sm font-semibold text-light-text transition hover:border-primary-500 hover:text-primary-600 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:hover:text-primary-500"
          >
            <LogOut className="size-4" aria-hidden="true" />
            {t("auth.logout")}
          </button>
        </SettingsRow>
      </SettingsPanel>

      <AdminSettingsSectionContent sectionId="security" hideHeader />
    </div>
  );
}

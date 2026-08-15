"use client";

import { gooeyToast } from "goey-toast";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Camera, Save, UserRound } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { InputField } from "@/components/common";
import { LoaderMini } from "@/components/common/loader-mini";
import { SettingsPanel, SettingsRow } from "@/components/dashboard/settings-ui";
import { getAccountDisplayName } from "@/components/site-account-menu";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { ADMIN_SETTINGS_FIELD_TONE } from "@/lib/admin/admin-settings-input-styles";
import { resolveDashboardProfileUrl } from "@/lib/dashboard-profile-assets";
import { useI18n } from "@/lib/i18n";
import { updateProfile, uploadProfilePhotos } from "@/services/profile.service";

export function AdminSettingsProfileContent() {
  const { t } = useI18n();
  const { user, status, refreshUser } = useAuth();
  const displayName = getAccountDisplayName(user, t("admin.settings.profile.defaultName"));
  const [name, setName] = useState(displayName);
  const [savingName, setSavingName] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  const profileUrl = resolveDashboardProfileUrl(
    user?.profileImageUrl ?? user?.profile_image,
  );

  useEffect(() => {
    setName(displayName);
  }, [displayName]);

  async function handleNameSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) {
      gooeyToast.error(t("admin.settings.profile.nameRequired"), {
        description: t("admin.settings.profile.nameRequiredDescription"),
      });
      return;
    }

    setSavingName(true);
    try {
      await updateProfile({ name: nextName });
      await refreshUser();
      gooeyToast.success(t("admin.settings.profile.saved"), {
        description: t("admin.settings.profile.savedDescription"),
      });
    } catch (error) {
      gooeyToast.error(t("admin.settings.profile.saveFailed"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.settings.profile.saveFailedDescription"),
      });
    } finally {
      setSavingName(false);
    }
  }

  async function handleProfileImageSelected(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      gooeyToast.error(t("dashboard.settings.profileImageInvalidTitle"), {
        description: t("dashboard.settings.profileImageInvalidDescription"),
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      gooeyToast.error(t("dashboard.settings.profileImageTooLargeTitle"), {
        description: t("dashboard.settings.profileImageTooLargeDescription"),
      });
      return;
    }

    setUploadingProfile(true);
    try {
      await uploadProfilePhotos({ profilePhoto: file });
      await refreshUser();
      gooeyToast.success(t("dashboard.settings.profileImageUpdatedTitle"), {
        description: t("admin.settings.profile.imageUpdatedDescription"),
      });
    } catch (error) {
      gooeyToast.error(t("dashboard.settings.profileImageUploadErrorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("dashboard.settings.profileImageUploadErrorFallback"),
      });
    } finally {
      setUploadingProfile(false);
    }
  }

  return (
    <div className="space-y-2">
      <AdminPageHeader
        eyebrow={t("admin.settings.common.eyebrow")}
        title={t("admin.settings.section.profile.label")}
        description={t("admin.settings.section.profile.description")}
      />

      <SettingsPanel
        title={t("admin.settings.profile.imageTitle")}
        description={t("admin.settings.profile.imageDescription")}
      >
        <SettingsRow
          label={t("admin.settings.profile.currentImage")}
          description={status === "loading" ? t("admin.settings.profile.loading") : user?.email}
          stackOnMobile
        >
          <div className="flex flex-wrap items-center justify-end gap-3">
            <span className="inline-flex size-16 overflow-hidden border border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg">
              {profileUrl ? (
                <Image
                  src={profileUrl}
                  alt=""
                  width={64}
                  height={64}
                  unoptimized
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-primary-600 dark:text-primary-400">
                  <UserRound className="size-6" aria-hidden="true" />
                </span>
              )}
            </span>
            <label className="inline-flex cursor-pointer items-center gap-2 border border-light-border bg-light-bg px-4 py-2.5 text-sm font-semibold text-light-text transition hover:border-primary-500 hover:text-primary-600 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:hover:text-primary-500">
              {uploadingProfile ? (
                <LoaderMini size={16} color="currentColor" />
              ) : (
                <Camera className="size-4" aria-hidden="true" />
              )}
              <span>{uploadingProfile ? t("dashboard.settings.profileImageUploading") : t("dashboard.settings.profileImageUpload")}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="sr-only"
                disabled={uploadingProfile}
                onChange={(event) => void handleProfileImageSelected(event)}
              />
            </label>
          </div>
        </SettingsRow>
      </SettingsPanel>

      <form onSubmit={handleNameSubmit}>
        <SettingsPanel
          title={t("admin.settings.profile.identityTitle")}
          description={t("admin.settings.profile.identityDescription")}
        >
          <div className="space-y-4 px-5 py-5 sm:px-6">
            <InputField
              label={t("admin.settings.profile.displayName")}
              value={name}
              onChange={(event) => setName(event.target.value)}
              tone={ADMIN_SETTINGS_FIELD_TONE}
              placeholder={t("admin.settings.profile.namePlaceholder")}
            />
            <button
              type="submit"
              disabled={savingName}
              className="btn-primary inline-flex items-center gap-2"
            >
              {savingName ? (
                <LoaderMini size={16} color="currentColor" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              <span>{savingName ? t("admin.settings.profile.saving") : t("admin.settings.profile.save")}</span>
            </button>
          </div>
        </SettingsPanel>
      </form>
    </div>
  );
}

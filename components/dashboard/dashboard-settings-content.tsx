"use client";
import { gooeyToast } from "goey-toast";

import { AlertDialog } from "radix-ui";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Camera,
  KeyRound,
  LogOut,
  Palette,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { InputField } from "@/components/common";
import { LoaderMini } from "@/components/common/loader-mini";
import { DashboardNotificationSettings } from "@/components/dashboard/dashboard-notification-settings";
import { DashboardPreferencesForm } from "@/components/dashboard/dashboard-preferences-form";
import {
  SettingsCategoryButton,
  SettingsCategoryNav,
  SettingsDangerPanel,
  SettingsPanel,
  SettingsRow,
} from "@/components/dashboard/settings-ui";
import { getAccountDisplayName } from "@/components/site-account-menu";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { resolveDashboardProfileUrl } from "@/lib/dashboard-profile-assets";
import { useI18n } from "@/lib/i18n";
import { appRoutes } from "@/routes/app-routes";
import { changePassword, deleteAccount, uploadProfilePhotos } from "@/services/profile.service";

type SettingsCategory =
  | "account"
  | "preferences"
  | "security"
  | "permissions"
  | "notifications"
  | "session";

const CATEGORY_IDS: SettingsCategory[] = [
  "account",
  "preferences",
  "security",
  "permissions",
  "notifications",
  "session",
];

function isSettingsCategory(value: string): value is SettingsCategory {
  return CATEGORY_IDS.includes(value as SettingsCategory);
}

function AccountAvatar({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  if (imageUrl) {
    return (
      <span className="inline-flex size-14 shrink-0 overflow-hidden border border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg">
        <Image
          src={imageUrl}
          alt=""
          width={56}
          height={56}
          unoptimized
          className="size-full object-cover"
        />
      </span>
    );
  }

  return (
    <span className="inline-flex size-14 shrink-0 items-center justify-center border border-light-border bg-primary-500/10 text-xl font-semibold text-primary-700 dark:border-dark-border dark:text-primary-400">
      {initial}
    </span>
  );
}

export function DashboardSettingsContent() {
  const { t } = useI18n();
  const { user, status, signOut, refreshUser } = useAuth();

  const [activeCategory, setActiveCategory] =
    useState<SettingsCategory>("account");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const syncCategoryFromHash = useCallback(() => {
    const hash = window.location.hash.replace("#", "");
    if (isSettingsCategory(hash)) {
      setActiveCategory(hash);
    }
  }, []);

  useEffect(() => {
    syncCategoryFromHash();
    window.addEventListener("hashchange", syncCategoryFromHash);
    return () => window.removeEventListener("hashchange", syncCategoryFromHash);
  }, [syncCategoryFromHash]);

  const selectCategory = useCallback((category: SettingsCategory) => {
    setActiveCategory(category);
    window.history.replaceState(null, "", `#${category}`);
  }, []);

  const categories = useMemo(
    () =>
      [
        {
          id: "account" as const,
          icon: UserRound,
          label: t("dashboard.settings.category.account"),
        },
        {
          id: "preferences" as const,
          icon: Palette,
          label: t("dashboard.settings.category.preferences"),
        },
        {
          id: "security" as const,
          icon: KeyRound,
          label: t("dashboard.settings.category.security"),
        },
        {
          id: "permissions" as const,
          icon: ShieldCheck,
          label: t("dashboard.settings.category.permissions"),
        },
        {
          id: "notifications" as const,
          icon: Bell,
          label: t("dashboard.settings.category.notifications"),
        },
        {
          id: "session" as const,
          icon: LogOut,
          label: t("dashboard.settings.category.session"),
        },
      ] satisfies Array<{
        id: SettingsCategory;
        icon: typeof UserRound;
        label: string;
      }>,
    [t],
  );

  async function onChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      gooeyToast.error(t("dashboard.settings.missingTitle"), {
        description: t("dashboard.settings.missingDescription"),
      })
      return;
    }

    if (newPassword.length < 8) {
      gooeyToast.error(t("dashboard.settings.weakTitle"), {
        description: t("dashboard.settings.weakDescription"),
      })
      return;
    }

    if (newPassword !== confirmPassword) {
      gooeyToast.error(t("dashboard.settings.mismatchTitle"), {
        description: t("dashboard.settings.mismatchDescription"),
      })
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      gooeyToast.success(t("dashboard.settings.successTitle"), {
        description: t("dashboard.settings.successDescription"),
      })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : t("dashboard.settings.errorFallback");
      gooeyToast.error(t("dashboard.settings.errorTitle"), {
        description: message,
      })
    } finally {
      setSavingPassword(false);
    }
  }

  async function onDeleteAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!deletePassword || !deleteConfirmation) {
      gooeyToast.error(t("dashboard.settings.deleteMissingTitle"), {
        description: t("dashboard.settings.deleteMissingDescription"),
      })
      return;
    }

    setDeletingAccount(true);
    try {
      await deleteAccount({
        password: deletePassword,
        confirmation: deleteConfirmation.trim(),
      });
      setDeleteOpen(false);
      setDeletePassword("");
      setDeleteConfirmation("");
      gooeyToast.success(t("dashboard.settings.deleteSuccessTitle"), {
        description: t("dashboard.settings.deleteSuccessDescription"),
      })
      await signOut({ redirectTo: appRoutes.login });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : t("dashboard.settings.deleteErrorFallback");
      gooeyToast.error(t("dashboard.settings.deleteErrorTitle"), {
        description: message,
      })
    } finally {
      setDeletingAccount(false);
    }
  }

  const displayName = getAccountDisplayName(user, t("account.account"));
  const profileUrl = resolveDashboardProfileUrl(
    user?.profileImageUrl ?? user?.profile_image,
  );

  async function onProfileImageSelected(event: React.ChangeEvent<HTMLInputElement>) {
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
        description: t("dashboard.settings.profileImageUpdatedDescription"),
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : t("dashboard.settings.profileImageUploadErrorFallback");
      gooeyToast.error(t("dashboard.settings.profileImageUploadErrorTitle"), {
        description: message,
      });
    } finally {
      setUploadingProfile(false);
    }
  }

  const panels: Record<SettingsCategory, React.ReactNode> = {
    account: (
      <SettingsPanel
        title={t("dashboard.settings.category.account")}
        description={t("dashboard.settings.accountPanelDescription")}
      >
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <AccountAvatar name={displayName} imageUrl={profileUrl} />
          <div className="min-w-0 flex-1">
            {status === "loading" ? (
              <div className="space-y-2">
                <div className="h-5 w-40 animate-pulse bg-light-border dark:bg-dark-border" />
                <div className="h-4 w-56 animate-pulse bg-light-border dark:bg-dark-border" />
              </div>
            ) : (
              <>
                <p className="truncate text-base font-semibold text-light-text dark:text-dark-text">
                  {displayName}
                </p>
                <p className="mt-0.5 truncate text-sm text-light-muted dark:text-dark-muted">
                  {user?.email ?? "—"}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-none border border-light-border bg-light-bg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-light-muted dark:border-dark-border dark:bg-dark-bg dark:text-dark-muted">
                    {user?.role ?? "user"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <SettingsRow
          label={t("dashboard.settings.profileImageLabel")}
          description={t("dashboard.settings.profileImageDescription")}
        >
          <label className="inline-flex cursor-pointer items-center gap-2 border border-light-border bg-light-bg px-4 py-2.5 text-sm font-semibold text-light-text transition hover:border-primary-500 hover:text-primary-600 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:hover:text-primary-500">
            {uploadingProfile ? (
              <LoaderMini size={16} color="currentColor" />
            ) : (
              <Camera className="size-4" aria-hidden="true" />
            )}
            <span>
              {uploadingProfile
                ? t("dashboard.settings.profileImageUploading")
                : t("dashboard.settings.profileImageUpload")}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="sr-only"
              disabled={uploadingProfile}
              onChange={(event) => void onProfileImageSelected(event)}
            />
          </label>
        </SettingsRow>

      </SettingsPanel>
    ),

    preferences: (
      <SettingsPanel
        title={t("dashboard.settings.preferencesTitle")}
        description={t("dashboard.settings.preferencesDescription")}
      >
        <DashboardPreferencesForm layout="settings" />
      </SettingsPanel>
    ),

    security: (
      <form onSubmit={onChangePassword}>
        <SettingsPanel
          title={t("dashboard.settings.passwordTitle")}
          description={t("dashboard.settings.passwordDescription")}
        >
          <div className="space-y-4 px-5 py-5 sm:px-6">
            <InputField
              label={t("dashboard.settings.currentPassword")}
              id="settings-current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              placeholder={t("dashboard.settings.currentPasswordPlaceholder")}
              tone="light"
            />
            <InputField
              label={t("dashboard.settings.newPassword")}
              id="settings-new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              placeholder={t("dashboard.settings.newPasswordPlaceholder")}
              tone="light"
            />
            <InputField
              label={t("dashboard.settings.confirmPassword")}
              id="settings-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              placeholder={t("dashboard.settings.confirmPasswordPlaceholder")}
              tone="light"
            />
            <div className="flex justify-end border-t border-light-border pt-4 dark:border-dark-border">
              <button type="submit" disabled={savingPassword} className="btn-primary">
                {savingPassword
                  ? t("dashboard.settings.saving")
                  : t("dashboard.settings.save")}
              </button>
            </div>
          </div>
        </SettingsPanel>
      </form>
    ),

    permissions: (
      <SettingsPanel
        title={t("dashboard.settings.permissionsTitle")}
        description={t("dashboard.settings.permissionsDescription")}
      >
        {[
          [
            t("dashboard.settings.permissions.salesLabel"),
            t("dashboard.settings.permissions.salesDescription"),
          ],
          [
            t("dashboard.settings.permissions.purchasesLabel"),
            t("dashboard.settings.permissions.purchasesDescription"),
          ],
          [
            t("dashboard.settings.permissions.productsLabel"),
            t("dashboard.settings.permissions.productsDescription"),
          ],
          [
            t("dashboard.settings.permissions.accountsLabel"),
            t("dashboard.settings.permissions.accountsDescription"),
          ],
          [
            t("dashboard.settings.permissions.transfersLabel"),
            t("dashboard.settings.permissions.transfersDescription"),
          ],
          [
            t("dashboard.settings.permissions.deleteRollbackLabel"),
            t("dashboard.settings.permissions.deleteRollbackDescription"),
          ],
        ].map(([label, description]) => (
          <SettingsRow key={label} label={label} description={description}>
            <span className="inline-flex items-center border border-light-border bg-light-bg px-2.5 py-1 text-xs font-semibold text-light-muted dark:border-dark-border dark:bg-dark-bg dark:text-dark-muted">
              {t("dashboard.settings.permissions.controlledByAdmin")}
            </span>
          </SettingsRow>
        ))}
      </SettingsPanel>
    ),

    notifications: (
      <SettingsPanel
        title={t("dashboard.settings.notificationsTitle")}
        description={t("dashboard.settings.notificationsDescription")}
      >
        <DashboardNotificationSettings />
      </SettingsPanel>
    ),

    session: (
      <div className="space-y-4">
        <SettingsPanel
          title={t("dashboard.settings.sessionTitle")}
          description={t("dashboard.settings.sessionDescription")}
        >
          <SettingsRow
            label={t("auth.logout")}
            description={t("dashboard.settings.signOutDescription")}
          >
            <button
              type="button"
              onClick={() => void signOut({ redirectTo: appRoutes.login })}
              className="inline-flex items-center gap-2 rounded-none border border-light-border bg-light-surface px-4 py-2.5 text-sm font-semibold text-light-text transition hover:border-primary-500 hover:text-primary-600 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text dark:hover:text-primary-500"
            >
              <LogOut className="size-4" aria-hidden="true" />
              {t("auth.logout")}
            </button>
          </SettingsRow>
        </SettingsPanel>

        <SettingsDangerPanel
          title={t("dashboard.settings.dangerZoneTitle")}
          description={t("dashboard.settings.dangerZoneDescription")}
        >
          <SettingsRow
            label={t("dashboard.settings.deleteAccountLabel")}
            description={t("dashboard.settings.deleteAccountDescription")}
          >
            <AlertDialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialog.Trigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-none border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-500/40 dark:bg-dark-surface dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  {t("dashboard.settings.deleteAccountAction")}
                </button>
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 border border-light-border bg-light-surface p-6 shadow-lg dark:border-dark-border dark:bg-dark-surface">
                  <AlertDialog.Title className="text-lg font-semibold text-light-text dark:text-dark-text">
                    {t("dashboard.settings.deleteDialogTitle")}
                  </AlertDialog.Title>
                  <AlertDialog.Description className="mt-2 text-sm text-light-muted dark:text-dark-muted">
                    {t("dashboard.settings.deleteDialogDescription")}
                  </AlertDialog.Description>

                  <form onSubmit={onDeleteAccount} className="mt-5 space-y-4">
                    <InputField
                      label={t("dashboard.settings.deletePasswordLabel")}
                      id="delete-account-password"
                      type="password"
                      value={deletePassword}
                      onChange={(event) => setDeletePassword(event.target.value)}
                      autoComplete="current-password"
                      placeholder={t("dashboard.settings.deletePasswordPlaceholder")}
                      tone="light"
                    />
                    <InputField
                      label={t("dashboard.settings.deleteConfirmLabel")}
                      id="delete-account-confirmation"
                      type="email"
                      value={deleteConfirmation}
                      onChange={(event) =>
                        setDeleteConfirmation(event.target.value)
                      }
                      placeholder={user?.email ?? t("dashboard.settings.deleteConfirmPlaceholder")}
                      tone="light"
                    />
                    <div className="flex flex-wrap justify-end gap-2 border-t border-light-border pt-4 dark:border-dark-border">
                      <AlertDialog.Cancel asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-none border border-light-border px-4 py-2.5 text-sm font-semibold text-light-text dark:border-dark-border dark:text-dark-text"
                        >
                          {t("dashboard.settings.deleteCancel")}
                        </button>
                      </AlertDialog.Cancel>
                      <button
                        type="submit"
                        disabled={deletingAccount}
                        className="inline-flex items-center justify-center rounded-none border border-red-600 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                      >
                        {deletingAccount
                          ? t("dashboard.settings.deleteSubmitting")
                          : t("dashboard.settings.deleteSubmit")}
                      </button>
                    </div>
                  </form>
                </AlertDialog.Content>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </SettingsRow>
        </SettingsDangerPanel>
      </div>
    ),
  };

  return (
    <section className="space-y-2">
      <div className="grid min-h-screen gap-2 bg-light-surface p-3 dark:bg-dark-surface lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-4 lg:self-start">
          <SettingsCategoryNav
            label={t("dashboard.settings.categoriesLabel")}
            ariaLabel={t("dashboard.settings.navLabel")}
          >
            {categories.map((category) => (
              <SettingsCategoryButton
                key={category.id}
                active={activeCategory === category.id}
                icon={category.icon}
                label={category.label}
                onClick={() => selectCategory(category.id)}
              />
            ))}
          </SettingsCategoryNav>
        </div>

        <div className="min-w-0">{panels[activeCategory]}</div>
      </div>
    </section>
  );
}

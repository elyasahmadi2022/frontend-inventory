"use client";
import { gooeyToast } from "goey-toast";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileImage,
  ShieldCheck,
} from "lucide-react";
import { InputField } from "@/components/common";
import StatusPill, {
  moderationStatusLabel,
  moderationStatusVariant,
} from "@/components/common/status-pill";
import { DashboardOverviewHero } from "@/components/dashboard/dashboard-overview-hero";
import { ApiError } from "@/lib/api";
import { isOwnerUser } from "@/lib/auth/roles";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { appRoutes } from "@/routes/app-routes";
import type { AuthUser } from "@/services/auth.service";
import {
  submitVerificationRequest,
  updateProfile,
} from "@/services/profile.service";

type DashboardProfileContentProps = {
  user: AuthUser | null;
  loading: boolean;
  onRefresh: () => Promise<AuthUser | null>;
};
function verificationDescription(
  status: AuthUser["verification_status"],
  t: (key: TranslationKey) => string,
): string {
  if (status === "verified") return t("dashboard.profile.verification.verified");
  if (status === "rejected") return t("dashboard.profile.verification.rejected");
  return t("dashboard.profile.verification.pending");
}

export function DashboardProfileContent({
  user,
  loading,
  onRefresh,
}: DashboardProfileContentProps) {
  const { t } = useI18n();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [jawazNumber, setJawazNumber] = useState("");
  const [jawazFiles, setJawazFiles] = useState<File[]>([]);
  const [submittingVerification, setSubmittingVerification] = useState(false);

  const isOwner = isOwnerUser(user);
  const verification = user?.verification_status ?? "pending_verification";
  const canSubmitVerification =
    isOwner &&
    verification !== "verified" &&
    (verification === "rejected" || verification === "pending_verification");

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? user.full_name ?? "");
    setPhone(user.phone ?? "");
    setBio(user.bio ?? "");
    setJawazNumber(user.jawaz_number ?? "");
  }, [user]);

  async function onSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      gooeyToast.error(t("dashboard.profile.nameRequiredTitle"), {
        description: t("dashboard.profile.nameRequiredDescription"),
      })
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: isOwner ? phone.trim() || undefined : undefined,
        bio: isOwner ? (bio.trim() ? bio.trim() : undefined) : undefined,
      });
      await onRefresh();
      gooeyToast.success(t("dashboard.profile.saveSuccessTitle"), {
        description: t("dashboard.profile.saveSuccessDescription"),
      })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : t("dashboard.profile.saveErrorFallback");
      gooeyToast.error(t("dashboard.profile.saveErrorTitle"), {
        description: message,
      })
    } finally {
      setSavingProfile(false);
    }
  }

  async function onSubmitVerification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!jawazNumber.trim()) {
      gooeyToast.error(t("dashboard.profile.jawazRequiredTitle"), {
        description: t("dashboard.profile.jawazRequiredDescription"),
      })
      return;
    }

    if (jawazFiles.length < 2) {
      gooeyToast.error(t("dashboard.profile.jawazImagesTitle"), {
        description: t("dashboard.profile.jawazImagesDescription"),
      })
      return;
    }

    setSubmittingVerification(true);
    try {
      await submitVerificationRequest({
        jawazNumber: jawazNumber.trim(),
        jawazImages: jawazFiles,
      });
      setJawazFiles([]);
      await onRefresh();
      gooeyToast.success(t("dashboard.profile.verificationSubmitSuccessTitle"), {
        description: t("dashboard.profile.verificationSubmitSuccessDescription"),
      })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : t("dashboard.profile.verificationSubmitErrorFallback");
      gooeyToast.error(t("dashboard.profile.verificationSubmitErrorTitle"), {
        description: message,
      })
    } finally {
      setSubmittingVerification(false);
    }
  }

  const handleJawazFiles = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = "";
      setJawazFiles(files.slice(0, 3));
    },
    [],
  );

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="h-[clamp(12rem,34vw,16rem)] animate-pulse bg-light-border/60 dark:bg-dark-border/80" />
        <div className="card-surface space-y-3">
          <div className="h-5 w-40 animate-pulse bg-light-border dark:bg-dark-border" />
          <div className="h-12 animate-pulse bg-light-border dark:bg-dark-border" />
          <div className="h-12 animate-pulse bg-light-border dark:bg-dark-border" />
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="card-surface max-w-xl">
        <p className="text-sm font-semibold text-light-text dark:text-dark-text">
          {t("dashboard.profile.unavailableTitle")}
        </p>
        <p className="mt-2 text-sm text-light-muted dark:text-dark-muted">
          {t("dashboard.profile.unavailableDescription")}
        </p>
        <Link href={appRoutes.login} className="btn-primary mt-4 inline-flex">
          {t("auth.login")}
        </Link>
      </section>
    );
  }

  const verificationVariant = moderationStatusVariant(
    verification === "pending_verification" ? "pending" : verification,
  );

  return (
    <section className="space-y-4">
      <DashboardOverviewHero user={user} verification={verification} />

      {isOwner ? (
        <div id="verification" className="card-surface scroll-mt-24">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-500">
                {t("dashboard.profile.verification.eyebrow")}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-light-text dark:text-dark-text">
                {t("dashboard.profile.verification.title")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-light-muted dark:text-dark-muted">
                {verificationDescription(verification, t)}
              </p>
            </div>
            <StatusPill
              label={moderationStatusLabel(
                verification === "pending_verification" ? "pending" : verification,
              )}
              variant={verificationVariant}
            />
          </div>

          {verification === "rejected" && user.owner_comment ? (
            <div className="mt-4 rounded-none border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
              <p className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  <span className="font-semibold">
                    {t("dashboard.profile.verification.adminNote")}:{" "}
                  </span>
                  {user.owner_comment}
                </span>
              </p>
            </div>
          ) : null}

          {verification === "verified" ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={appRoutes.myListings} className="btn-primary inline-flex">
                {t("dashboard.nav.listings")}
              </Link>
              <Link
                href={appRoutes.newListing}
                className="inline-flex items-center justify-center rounded-none border border-light-border px-4 py-2.5 text-sm font-semibold text-light-text transition hover:border-primary-500 hover:text-primary-600 dark:border-dark-border dark:text-dark-text dark:hover:text-primary-500"
              >
                {t("dashboard.nav.newListing")}
              </Link>
              {user.owner_id ? (
                <Link
                  href={appRoutes.ownerProfile(user.owner_id)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline dark:text-primary-500"
                >
                  {t("dashboard.profile.viewPublicProfile")}
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          ) : null}

          {canSubmitVerification ? (
            <form onSubmit={onSubmitVerification} className="mt-6 space-y-4 border-t border-light-border pt-6 dark:border-dark-border">
              <div className="flex items-start gap-3">
                {verification === "pending_verification" ? (
                  <Clock3 className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                ) : (
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary-600 dark:text-primary-500" />
                )}
                <div>
                  <h3 className="text-sm font-semibold text-light-text dark:text-dark-text">
                    {verification === "rejected"
                      ? t("dashboard.profile.verification.resubmitTitle")
                      : t("dashboard.profile.verification.updateDocsTitle")}
                  </h3>
                  <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
                    {verification === "rejected"
                      ? t("dashboard.profile.verification.resubmitDescription")
                      : t("dashboard.profile.verification.updateDocsDescription")}
                  </p>
                </div>
              </div>

              <InputField
                label={t("register.jawazNumber")}
                id="profile-jawaz-number"
                value={jawazNumber}
                onChange={(event) => setJawazNumber(event.target.value)}
                placeholder={t("register.jawazPlaceholder")}
                tone="light"
              />

              <label className="block space-y-2">
                <span className="text-sm font-medium text-light-text dark:text-dark-text">
                  {t("dashboard.profile.verification.jawazImagesLabel")}
                </span>
                <span className="block text-xs text-light-muted dark:text-dark-muted">
                  {t("dashboard.profile.verification.jawazImagesHint")}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleJawazFiles}
                  className="block w-full text-sm text-light-text file:mr-3 file:rounded-none file:border-0 file:bg-primary-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-600 dark:text-dark-text"
                />
                {jawazFiles.length > 0 ? (
                  <ul className="space-y-1 text-xs text-light-muted dark:text-dark-muted">
                    {jawazFiles.map((file) => (
                      <li key={`${file.name}-${file.size}`} className="flex items-center gap-2">
                        <FileImage className="size-3.5 shrink-0" aria-hidden="true" />
                        {file.name}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </label>

              {(user.jawaz_images?.length ?? 0) > 0 ? (
                <p className="text-xs text-light-muted dark:text-dark-muted">
                  {t("dashboard.profile.verification.currentDocs", {
                    count: String(user.jawaz_images?.length ?? 0),
                  })}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submittingVerification}
                className="btn-primary inline-flex"
              >
                {submittingVerification
                  ? t("dashboard.profile.verification.submitting")
                  : t("dashboard.profile.verification.submit")}
              </button>
            </form>
          ) : null}

          {verification === "verified" ? (
            <div className="mt-4 flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{t("dashboard.profile.verification.verifiedHint")}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <form onSubmit={onSaveProfile} className="card-surface space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-light-text dark:text-dark-text">
              {t("dashboard.profile.detailsTitle")}
            </h2>
            <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
              {t("dashboard.profile.detailsDescription")}
            </p>
          </div>

          <dl className="grid gap-3 rounded-none border border-light-border p-4 text-sm dark:border-dark-border">
            <div className="flex justify-between gap-4">
              <dt className="text-light-muted dark:text-dark-muted">
                {t("dashboard.profile.emailLabel")}
              </dt>
              <dd className="font-medium text-light-text dark:text-dark-text">
                {user.email ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-light-muted dark:text-dark-muted">
                {t("dashboard.profile.roleLabel")}
              </dt>
              <dd className="font-medium capitalize text-light-text dark:text-dark-text">
                {user.role ?? "—"}
              </dd>
            </div>
          </dl>

          <InputField
            label={t("dashboard.profile.displayNameLabel")}
            id="profile-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            tone="light"
          />

          {isOwner ? (
            <>
              <InputField
                label={t("dashboard.profile.phoneLabel")}
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                tone="light"
              />
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-light-text dark:text-dark-text">
                  {t("dashboard.profile.bioLabel")}
                </span>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={4}
                  className="w-full resize-y rounded-none border border-light-border bg-light-bg px-3.5 py-3 text-sm text-light-text outline-none transition focus:border-primary-500 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text"
                  placeholder={t("dashboard.profile.bioPlaceholder")}
                />
              </label>
            </>
          ) : null}

          <button type="submit" disabled={savingProfile} className="btn-primary">
            {savingProfile
              ? t("dashboard.profile.saving")
              : t("dashboard.profile.save")}
          </button>
        </form>

        <aside className="space-y-4">
          <div className="card-surface">
            <h2 className="text-lg font-semibold text-light-text dark:text-dark-text">
              {t("dashboard.profile.quickActionsTitle")}
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  href={appRoutes.dashboardSettings}
                  className="font-semibold text-primary-600 hover:underline dark:text-primary-500"
                >
                  {t("dashboard.profile.openSettings")}
                </Link>
                <p className="mt-1 text-light-muted dark:text-dark-muted">
                  {t("dashboard.profile.openSettingsDescription")}
                </p>
              </li>
              {isOwner ? (
                <li>
                  <Link
                    href={appRoutes.dashboardNotifications}
                    className="font-semibold text-primary-600 hover:underline dark:text-primary-500"
                  >
                    {t("dashboard.nav.notifications")}
                  </Link>
                  <p className="mt-1 text-light-muted dark:text-dark-muted">
                    {t("dashboard.profile.notificationsDescription")}
                  </p>
                </li>
              ) : null}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

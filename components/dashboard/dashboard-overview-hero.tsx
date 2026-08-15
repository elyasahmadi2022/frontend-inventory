"use client";

import { LoaderMini } from "@/components/common/loader-mini";
import StatusPill, {
  type StatusPillVariant,
} from "@/components/common/status-pill";
import { ContentReveal } from "@/components/motion/content-reveal";
import { getAccountDisplayName } from "@/components/site-account-menu";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { isOwnerUser } from "@/lib/auth/roles";
import {
  resolveDashboardCoverUrl,
  resolveDashboardProfileUrl,
} from "@/lib/dashboard-profile-assets";
import { useI18n } from "@/lib/i18n";
import type { AuthUser } from "@/services/auth.service";
import { uploadProfilePhotos } from "@/services/profile.service";
import { gooeyToast } from "goey-toast";
import { Camera, Mail, UserRound } from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

type DashboardOverviewHeroProps = {
  user: AuthUser;
  verification: string;
};

function verificationBadge(verification: string): {
  label: string;
  variant: StatusPillVariant;
} {
  const normalized = verification.toLowerCase();
  if (normalized === "verified") {
    return { label: "Verified", variant: "success" };
  }
  if (normalized === "rejected") {
    return { label: "Rejected", variant: "error" };
  }
  return { label: "Pending verification", variant: "warning" };
}

function MetaBadge({
  icon,
  children,
  className = "",
}: {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-none border border-light-border bg-light-bg px-2.5 py-1 text-[11px] font-medium text-light-text dark:border-white/10 dark:bg-dark-bg dark:text-dark-text ${className}`}
    >
      {icon ? (
        <span className="shrink-0 text-light-muted dark:text-dark-muted">
          {icon}
        </span>
      ) : null}
      <span className="truncate">{children}</span>
    </span>
  );
}

function PhotoChangeButton({
  label,
  onClick,
  busy,
  compact = false,
  className = "",
}: {
  label: string;
  onClick: () => void;
  busy?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label={label}
      title={label}
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 border border-white/25 bg-black/55 text-white shadow-sm backdrop-blur-sm transition hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-70 ${
        compact
          ? "size-9 rounded-full"
          : "rounded-none px-3 py-1.5 text-xs font-semibold"
      } ${className}`}
    >
      {busy ? (
        <LoaderMini size={16} color="currentColor" />
      ) : (
        <Camera className={compact ? "size-4" : "size-3.5"} aria-hidden="true" />
      )}
      {compact ? null : <span>{label}</span>}
    </button>
  );
}

export function DashboardOverviewHero({
  user,
  verification,
}: DashboardOverviewHeroProps) {
  const { t } = useI18n();
  const { refreshUser } = useAuth();
  const isOwner = isOwnerUser(user);
  const canEditProfilePhoto = Boolean(user.id ?? user.email);
  const canEditCoverPhoto = isOwner;

  const coverInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  const coverUrl = resolveDashboardCoverUrl(user.cover_image);
  const profileUrl = resolveDashboardProfileUrl(
    user.profileImageUrl ?? user.profile_image,
  );
  const displayCoverUrl = coverPreview ?? coverUrl;
  const displayProfileUrl = profilePreview ?? profileUrl;
  const displayName = getAccountDisplayName(user, "Owner");
  const badge = verificationBadge(verification);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      if (profilePreview) URL.revokeObjectURL(profilePreview);
    };
  }, [coverPreview, profilePreview]);

  useEffect(() => {
    setCoverPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setProfilePreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
  }, [user.cover_image, user.profileImageUrl, user.profile_image]);

  const handlePhotoError = useCallback(
    (kind: "cover" | "profile", error: unknown) => {
      if (kind === "cover") {
        setCoverPreview(null);
      } else {
        setProfilePreview(null);
      }

      const message =
        error instanceof ApiError
          ? error.message
          : kind === "cover"
            ? t("dashboard.hero.coverUploadError")
            : t("dashboard.hero.profileUploadError");


            gooeyToast.error( kind === "cover"
              ? t("dashboard.hero.coverUploadFailed")
              : t("dashboard.hero.profileUploadFailed"),{
                description: message,
              })

    },
    [ t],
  );

  const handleCoverSelected = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        gooeyToast.error(t("dashboard.hero.invalidFileTitle"),{
          description:   t("dashboard.hero.invalidFileDescription")
        })

        return;
      }

      const preview = URL.createObjectURL(file);
      setCoverPreview((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return preview;
      });
      setUploadingCover(true);

      try {
        await uploadProfilePhotos({ coverPhoto: file });
        await refreshUser();

        gooeyToast.success(t("dashboard.hero.coverUploadSuccess"),{
          description: t("dashboard.hero.coverUploadSuccessDescription"),
        })

      } catch (error) {
        handlePhotoError("cover", error);
      } finally {
        setUploadingCover(false);
      }
    },
    [handlePhotoError, refreshUser,t],
  );

  const handleProfileSelected = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      if (!file.type.startsWith("image/")) {

        gooeyToast.error(t("dashboard.hero.invalidFileTitle"), {
          description: t("dashboard.hero.invalidFileDescription"),
        })

        return;
      }

      const preview = URL.createObjectURL(file);
      setProfilePreview((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return preview;
      });
      setUploadingProfile(true);

      try {
        await uploadProfilePhotos({ profilePhoto: file });
        await refreshUser();

        gooeyToast.success(t("dashboard.hero.profileUploadSuccess"), {
          description: t("dashboard.hero.profileUploadSuccessDescription"),
        })

      } catch (error) {
        handlePhotoError("profile", error);
      } finally {
        setUploadingProfile(false);
      }
    },
    [handlePhotoError, refreshUser, t],
  );

  return (
    <section className="overflow-hidden rounded-none border border-light-border bg-light-surface shadow-sm dark:border-transparent dark:bg-dark-surface dark:shadow-dark-sm">
      <div className="group relative h-[clamp(7rem,24vw,10rem)] w-full">
        <Image
          key={displayCoverUrl}
          src={displayCoverUrl}
          alt=""
          fill
          priority
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-t from-light-text/60 via-light-text/20 to-transparent dark:from-dark-bg/88 dark:via-dark-bg/35 dark:to-transparent" />
        <div className="absolute inset-0 bg-primary-500/10" />

        {canEditCoverPhoto ? (
          <>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => void handleCoverSelected(event)}
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-end p-3 sm:p-4">
              <PhotoChangeButton
                label={t("dashboard.hero.changeCover")}
                onClick={() => coverInputRef.current?.click()}
                busy={uploadingCover}
                className="opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              />
            </div>
          </>
        ) : null}
      </div>

      <div className="relative px-4 pb-5 sm:px-6 sm:pb-6 md:px-8 md:pb-8">
        <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:gap-5 sm:text-start">
          <ContentReveal
            delay={0.05}
            className="-mt-[clamp(3.25rem,14vw,4.5rem)] shrink-0 sm:-mt-[clamp(3.5rem,12vw,5rem)]"
          >
            <div className="group/avatar relative size-[clamp(5.5rem,22vw,8.5rem)] overflow-hidden rounded-none border-[3px] border-light-surface bg-light-bg  ring-2 ring-primary-500/15 sm:border-4 dark:border-dark-surface dark:bg-dark-bg dark:shadow-dark-md dark:ring-primary-500/20">
              <Image
                key={displayProfileUrl}
                src={displayProfileUrl}
                alt=""
                fill
                priority
                unoptimized
                sizes="(max-width: 640px) 34vw, 136px"
                className="object-cover object-center"
              />

              {canEditProfilePhoto ? (
                <>
                  <input
                    ref={profileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => void handleProfileSelected(event)}
                  />
                  <div className="absolute inset-x-0 bottom-0 flex justify-end p-1.5 sm:p-2">
                    <PhotoChangeButton
                      label={t("dashboard.hero.changeProfile")}
                      onClick={() => profileInputRef.current?.click()}
                      busy={uploadingProfile}
                      compact
                      className="opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover/avatar:opacity-100 sm:focus-visible:opacity-100"
                    />
                  </div>
                </>
              ) : null}
            </div>
          </ContentReveal>

          <ContentReveal delay={0.1} className="min-w-0 flex-1 pb-0.5 sm:pb-1">
            <div className="mx-auto mt-2 flex max-w-2xl flex-wrap items-center justify-center gap-2 sm:mx-0 sm:justify-start">
              <MetaBadge icon={<UserRound className="size-3" aria-hidden="true" />}>
                {displayName}
              </MetaBadge>
              {user.email ? (
                <MetaBadge icon={<Mail className="size-3" aria-hidden="true" />}>
                  {user.email}
                </MetaBadge>
              ) : null}
              <StatusPill label={badge.label} variant={badge.variant} />
              <MetaBadge className="capitalize">{user.role ?? "owner"}</MetaBadge>
            </div>

            <p className="mx-auto mt-3 max-w-2xl text-xs text-muted sm:mx-0">
              Track verification, manage listings, and keep your property
              portfolio up to date.
            </p>
          </ContentReveal>
        </div>
      </div>
    </section>
  );
}

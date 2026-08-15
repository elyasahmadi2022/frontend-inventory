"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import {
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownMenuRoot,
  DropdownRadioGroup,
  DropdownRadioItem,
  DropdownSeparator,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
  DropdownTrigger,
} from "@/components/common";
import {
  appLanguages,
  getStoredTheme,
  setStoredTheme,
  subscribeToUserPreferences,
  type AppLanguage,
  type AppTheme,
} from "@/lib/user-preferences";
import { useI18n } from "@/lib/i18n";
import { resolveUploadAssetUrl } from "@/lib/asset-url";
import { appRoutes } from "@/routes/app-routes";
import { useAuth } from "@/hooks/use-auth";
import type { AuthUser } from "@/services/auth.service";

export function getAccountDisplayName(
  user: AuthUser | null | undefined,
  fallback = "Account",
): string {
  if (!user) return fallback;
  return user.name ?? user.full_name ?? user.email ?? fallback;
}

export function getAccountInitials(user: AuthUser): string {
  const name = getAccountDisplayName(user, "Account");
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function getUserProfileImageUrl(user: AuthUser): string {
  return (
    resolveUploadAssetUrl(user.profileImageUrl ?? user.profile_image, "profile") ??
    ""
  );
}

type AccountAvatarProps = {
  user: AuthUser;
  size?: "sm" | "md";
  className?: string;
};

export function AccountAvatar({
  user,
  size = "md",
  className = "",
}: AccountAvatarProps) {
  const src = getUserProfileImageUrl(user);
  const sizeClass = size === "sm" ? "h-9 w-9" : "h-10 w-10";

  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-none border border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg ${sizeClass} ${className}`}
    >
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}

export function SidebarAccountTrigger({
  user,
  collapsed,
}: {
  user: AuthUser;
  collapsed: boolean;
}) {
  const { t } = useI18n();

  if (collapsed) {
    return <AccountAvatar user={user} size="md" />;
  }

  return (
    <span className="flex min-w-0 w-full items-center gap-3 text-start">
      <AccountAvatar user={user} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-light-text dark:text-dark-text">
          {getAccountDisplayName(user, t("account.account"))}
        </span>
        <span className="mt-0.5 block truncate text-xs text-light-muted dark:text-dark-muted">
          {user.email}
        </span>
        <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-500">
          {t("sidebar.viewProfile")}
        </span>
      </span>
    </span>
  );
}

function LanguageIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 1 0 9 9c0-.5 0-1-.1-1.5A7 7 0 0 1 12 3Z" />
    </svg>
  );
}

export function AccountMenuUserHeader({ user }: { user: AuthUser }) {
  const { t } = useI18n();

  return (
    <DropdownLabel className="normal-case tracking-normal">
      <span className="flex items-center gap-3">
        <AccountAvatar user={user} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-light-text dark:text-dark-text">
            {getAccountDisplayName(user, t("account.account"))}
          </span>
          <span className="mt-0.5 block truncate text-xs font-normal lowercase text-light-muted dark:text-dark-muted">
            {user.email}
          </span>
        </span>
      </span>
    </DropdownLabel>
  );
}

export function AccountMenuPreferences() {
  const { changeLanguage, language, t } = useI18n();
  const theme = useSyncExternalStore<AppTheme>(
    subscribeToUserPreferences,
    getStoredTheme,
    () => "light",
  );

  return (
    <>
      <DropdownSub>
        <DropdownSubTrigger
          icon={<LanguageIcon />}
          data={
            appLanguages.find((option) => option.value === language)?.labels[
              language
            ]
          }
        >
          {t("preferences.language")}
        </DropdownSubTrigger>
        <DropdownSubContent>
          <DropdownLabel>{t("preferences.language")}</DropdownLabel>
          <DropdownRadioGroup
            value={language}
            onValueChange={(value) => changeLanguage(value as AppLanguage)}
          >
            {appLanguages.map((option) => (
              <DropdownRadioItem key={option.value} value={option.value}>
                <span lang={option.value} dir={option.direction}>
                  {option.labels[language]}
                </span>
              </DropdownRadioItem>
            ))}
          </DropdownRadioGroup>
        </DropdownSubContent>
      </DropdownSub>
      <DropdownSub>
        <DropdownSubTrigger
          icon={<ThemeIcon />}
          data={
            theme === "dark" ? t("preferences.dark") : t("preferences.light")
          }
        >
          {t("preferences.appearance")}
        </DropdownSubTrigger>
        <DropdownSubContent>
          <DropdownLabel>{t("preferences.appearance")}</DropdownLabel>
          <DropdownRadioGroup
            value={theme}
            onValueChange={(value) => setStoredTheme(value as AppTheme)}
          >
            <DropdownRadioItem value="light">
              {t("preferences.light")}
            </DropdownRadioItem>
            <DropdownRadioItem value="dark">
              {t("preferences.dark")}
            </DropdownRadioItem>
          </DropdownRadioGroup>
        </DropdownSubContent>
      </DropdownSub>
    </>
  );
}

export function AccountMenuLogout() {
  const { signOut } = useAuth();
  const { t } = useI18n();

  return (
    <DropdownItem variant="danger" onSelect={() => void signOut({ redirectTo: appRoutes.login })}>
      {t("auth.logout")}
    </DropdownItem>
  );
}

export function AccountMenuGuestActions() {
  const { t } = useI18n();

  return (
    <>
      <Link
        href={appRoutes.login}
        className="inline-flex min-h-10 items-center justify-center rounded-none border border-light-border px-4 py-2 text-sm font-medium text-light-text transition hover:border-primary-500 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 dark:border-dark-border dark:text-dark-text dark:hover:text-primary-500"
      >
        {t("auth.login")}
      </Link>
      <Link
        href={appRoutes.register}
        className="inline-flex min-h-10 items-center justify-center rounded-none border border-primary-500 bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:border-primary-600 hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
      >
        {t("auth.register")}
      </Link>
    </>
  );
}

export function AccountMenuGuestPreferences() {
  const { t } = useI18n();

  return (
    <DropdownMenuRoot>
      <DropdownTrigger
        compact
        showArrow={false}
        aria-label={t("preferences.openMenu")}
      >
        <span className="flex h-full w-full items-center justify-center">
          <LanguageIcon />
        </span>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-64">
        <DropdownLabel>{t("preferences.title")}</DropdownLabel>
        <AccountMenuPreferences />
      </DropdownContent>
    </DropdownMenuRoot>
  );
}

type SiteAccountMenuProps = {
  user: AuthUser | null | undefined;
  /** Dropdown body when the user is signed in. Compose with AccountMenu* helpers. */
  children?: ReactNode;
  /** Replaces default login/register buttons for signed-out users. */
  guestActions?: ReactNode;
  /** Preferences dropdown shown next to guest actions. Pass `null` to hide. */
  guestPreferences?: ReactNode;
  /** Override the default trigger for this placement. */
  triggerLabel?: ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
  contentClassName?: string;
  triggerClassName?: string;
  loadingPlaceholderClassName?: string;
  /**
   * Toolbar = compact avatar (headers). Sidebar = avatar when collapsed,
   * avatar + identity when expanded.
   */
  variant?: "toolbar" | "sidebar";
  /** Sidebar only — whether the rail is collapsed. */
  collapsed?: boolean;
  /** @deprecated Prefer `variant` + `collapsed`. Kept for custom overrides. */
  compact?: boolean;
  showTriggerArrow?: boolean;
};

const triggerAccentClass = "font-semibold";

function resolveAccountMenuTrigger(
  user: AuthUser,
  variant: "toolbar" | "sidebar",
  collapsed: boolean,
): ReactNode {
  if (variant === "toolbar" || collapsed) {
    return <AccountAvatar user={user} size="md" />;
  }

  return <SidebarAccountTrigger user={user} collapsed={false} />;
}

export function SiteAccountMenu({
  user,
  children,
  guestActions,
  guestPreferences,
  triggerLabel,
  align = "end",
  className,
  contentClassName,
  triggerClassName,
  loadingPlaceholderClassName,
  variant = "toolbar",
  collapsed = false,
  compact,
  showTriggerArrow,
}: SiteAccountMenuProps) {
  const { t } = useI18n();
  const isToolbar = variant === "toolbar";
  const isCompact = compact ?? (isToolbar || collapsed);
  const shouldShowArrow = showTriggerArrow ?? (variant === "sidebar" && !collapsed);

  if (user === undefined) {
    return (
      <div
        className={
          loadingPlaceholderClassName ??
          (isToolbar || collapsed ? "h-10 w-10" : "h-11 w-full")
        }
        aria-hidden="true"
      />
    );
  }

  if (!user) {
    const resolvedGuestActions = guestActions ?? <AccountMenuGuestActions />;
    const resolvedGuestPreferences =
      guestPreferences === undefined ? (
        <AccountMenuGuestPreferences />
      ) : (
        guestPreferences
      );

    return (
      <div className={`flex items-center gap-2 ${className ?? ""}`}>
        {resolvedGuestActions}
        {resolvedGuestPreferences}
      </div>
    );
  }

  const resolvedTrigger =
    triggerLabel ?? resolveAccountMenuTrigger(user, variant, collapsed);

  return (
    <DropdownMenuRoot>
      <DropdownTrigger
        compact={isCompact}
        tone="neutral"
        showArrow={shouldShowArrow}
        aria-label={t("account.openMenu")}
        className={`${triggerAccentClass} ${
          isCompact
            ? "!border-0 !bg-transparent p-0 shadow-none hover:!border-transparent hover:!bg-transparent data-[state=open]:!border-transparent data-[state=open]:!bg-transparent dark:!bg-transparent dark:hover:!bg-transparent dark:data-[state=open]:!bg-transparent"
            : "h-auto min-h-11 w-full justify-start px-2.5 py-2 text-start"
        } ${triggerClassName ?? ""}`}
      >
        {resolvedTrigger}
      </DropdownTrigger>
      <DropdownContent
        align={align}
        className={`w-64 ${contentClassName ?? ""}`}
      >
        {children}
      </DropdownContent>
    </DropdownMenuRoot>
  );
}

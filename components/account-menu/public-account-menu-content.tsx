"use client";

import { DropdownLinkItem, DropdownSeparator } from "@/components/common";
import {
  AccountMenuLogout,
  AccountMenuPreferences,
  AccountMenuUserHeader,
} from "@/components/site-account-menu";
import { useI18n } from "@/lib/i18n";
import { appRoutes } from "@/routes/app-routes";
import { isAdminUser } from "@/lib/auth/roles";
import type { AuthUser } from "@/services/auth.service";

type PublicAccountMenuContentProps = {
  user: AuthUser;
};

export function PublicAccountMenuContent({ user }: PublicAccountMenuContentProps) {
  const { t } = useI18n();
  const admin = isAdminUser(user);

  return (
    <>
      <AccountMenuUserHeader user={user} />
      <DropdownSeparator />
      <DropdownLinkItem
        href={admin ? appRoutes.adminDashboard : appRoutes.dashboard}
      >
        {admin ? t("account.adminConsole") : t("account.dashboard")}
      </DropdownLinkItem>
      <DropdownSeparator />
      <AccountMenuPreferences />
      <DropdownSeparator />
      <AccountMenuLogout />
    </>
  );
}

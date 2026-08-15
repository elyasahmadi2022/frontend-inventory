"use client";

import { DropdownItem, DropdownLinkItem, DropdownSeparator } from "@/components/common";
import {
  AccountMenuPreferences,
  AccountMenuUserHeader,
} from "@/components/site-account-menu";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { appRoutes } from "@/routes/app-routes";
import type { AuthUser } from "@/services/auth.service";

type AdminAccountMenuContentProps = {
  user: AuthUser;
};

export function AdminAccountMenuContent({ user }: AdminAccountMenuContentProps) {
  const { t } = useI18n();
  const { signOut } = useAuth();

  return (
    <>
      <AccountMenuUserHeader user={user} />
      <DropdownSeparator />
      <DropdownLinkItem href={appRoutes.adminDashboard}>
        {t("admin.nav.overview")}
      </DropdownLinkItem>
      <DropdownLinkItem href={appRoutes.adminSettings}>
        {t("admin.nav.settings")}
      </DropdownLinkItem>
      <DropdownSeparator />
      <AccountMenuPreferences />
      <DropdownSeparator />
      <DropdownItem
        variant="danger"
        onSelect={() => void signOut({ redirectTo: appRoutes.adminLogin })}
      >
        {t("auth.logout")}
      </DropdownItem>
    </>
  );
}

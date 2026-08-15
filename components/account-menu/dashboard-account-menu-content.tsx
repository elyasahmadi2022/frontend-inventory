"use client";

import { DropdownSeparator } from "@/components/common";
import {
  AccountMenuLogout,
  AccountMenuPreferences,
  AccountMenuUserHeader,
} from "@/components/site-account-menu";
import { type AuthUser } from "@/services/auth.service";

type DashboardAccountMenuContentProps = {
  user: AuthUser;
};

export function DashboardAccountMenuContent({
  user,
}: DashboardAccountMenuContentProps) {
  return (
    <>
      <AccountMenuUserHeader user={user} />
      <DropdownSeparator />
      <DropdownSeparator />
      <AccountMenuPreferences />
      <DropdownSeparator />
      <AccountMenuLogout />
    </>
  );
}

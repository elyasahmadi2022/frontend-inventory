"use client";

import {
  Info,
  Mail,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import TableRowActionsMenu from "@/components/common/table-row-actions-menu";
import { useI18n } from "@/lib/i18n";
import { appRoutes } from "@/routes/app-routes";
import type { AdminUserRow } from "@/services/admin-users.service";

type AdminUserRowActionsMenuProps = {
  row: AdminUserRow;
  busy?: boolean;
  onDelete?: (row: AdminUserRow) => void;
  onToggleStatus?: (row: AdminUserRow) => void;
};

export default function AdminUserRowActionsMenu({
  row,
  busy = false,
  onDelete,
  onToggleStatus,
}: AdminUserRowActionsMenuProps) {
  const { t } = useI18n();
  const disabled = row.isDeleted;

  return (
    <TableRowActionsMenu
      triggerAriaLabel={t("admin.users.actions.trigger", { name: row.name })}
      categories={[
        {
          label: t("admin.users.actions.account"),
          items: [
            {
              id: "details",
              label: t("admin.users.actions.details"),
              icon: Info,
              href: appRoutes.adminUserDetails(row.id),
            },
            {
              id: "email",
              label: t("admin.users.actions.email"),
              icon: Mail,
              href: `mailto:${row.email}`,
              hidden: !row.email,
            },
            {
              id: disabled ? "activate" : "deactivate",
              label: disabled
                ? t("admin.users.actions.activate")
                : t("admin.users.actions.deactivate"),
              icon: disabled ? Power : PowerOff,
              disabled: busy,
              onSelect: () => onToggleStatus?.(row),
            },
            {
              id: "delete",
              label: t("admin.users.actions.delete"),
              icon: Trash2,
              disabled: busy || disabled,
              hidden: disabled,
              variant: "danger",
              onSelect: () => onDelete?.(row),
            },
          ],
        },
      ]}
    />
  );
}

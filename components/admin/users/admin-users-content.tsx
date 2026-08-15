"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminAllUsersContent } from "@/components/admin/users/admin-all-users-content";
import { useI18n } from "@/lib/i18n";

export function AdminUsersContent() {
  const { t } = useI18n();
  return (
    <div className="space-y-1">
      <AdminPageHeader
        eyebrow={t("admin.users.eyebrow")}
        title={t("admin.users.title")}
        description={t("admin.users.description")}
      />
      <div className="space-y-1">
       <AdminAllUsersContent /> 
      </div>
    </div>
  );
}

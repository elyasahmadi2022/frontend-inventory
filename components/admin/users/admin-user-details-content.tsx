"use client";

import { gooeyToast } from "goey-toast";
import { useEffect } from "react";
import {
  AdminDetailField,
  AdminDetailPageSkeleton,
  AdminDetailSection,
  AdminDetailToolbar,
  AdminRecordNotFound,
  formatAdminDate,
} from "@/components/admin/admin-detail-layout";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import StatusPill from "@/components/common/status-pill";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAdminUserQuery } from "@/lib/query/hooks";
import { appRoutes } from "@/routes/app-routes";

type AdminUserDetailsContentProps = {
  userId: string;
  backHref?: string;
  backLabel?: string;
};

export function AdminUserDetailsContent({
  userId,
  backHref = appRoutes.adminUsers,
  backLabel,
}: AdminUserDetailsContentProps) {
  const { t } = useI18n();
  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminUserQuery(userId);

  useEffect(() => {
    if (!isError) return;
    gooeyToast.error(t("admin.users.details.loadFailedTitle"), {
      description:
        error instanceof ApiError
          ? error.message
          : t("admin.users.details.loadFailedFallback"),
    });
  }, [error, isError, t]);

  const resolvedBackLabel = backLabel ?? t("admin.users.details.back");

  if (isLoading) {
    return <AdminDetailPageSkeleton />;
  }

  if (isError || !user) {
    return (
      <AdminRecordNotFound
        backHref={backHref}
        backLabel={resolvedBackLabel}
        message={t("admin.users.details.notFound")}
      />
    );
  }

  return (
    <div className="space-y-2">
      <AdminDetailToolbar
        backHref={backHref}
        backLabel={resolvedBackLabel}
        onRefresh={() => void refetch()}
      />

      <AdminPageHeader
        eyebrow={`${t("admin.users.eyebrow")} ${user.code || user.id.slice(0, 8)}`}
        title={user.name}
        description={user.email || user.username}
        actions={
          <StatusPill
            label={
              user.isDeleted
                ? t("admin.users.status.disabled")
                : t("admin.users.status.active")
            }
            variant={user.isDeleted ? "error" : "success"}
          />
        }
      />

      <AdminDetailSection title={t("admin.users.details.overview")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminDetailField
            label={t("admin.users.column.id")}
            value={user.code || user.id}
          />
          <AdminDetailField
            label={t("admin.users.column.user")}
            value={user.name}
          />
          <AdminDetailField
            label={t("admin.users.username")}
            value={user.username}
          />
          <AdminDetailField
            label={t("admin.users.column.email")}
            value={user.email || "—"}
          />
          <AdminDetailField
            label={t("admin.users.column.role")}
            value={<span className="capitalize">{user.role}</span>}
          />
          <AdminDetailField
            label={t("admin.users.column.status")}
            value={
              user.isDeleted
                ? t("admin.users.status.disabled")
                : t("admin.users.status.active")
            }
          />
          <AdminDetailField
            label={t("admin.users.column.joined")}
            value={formatAdminDate(user.createdAt)}
          />
          <AdminDetailField
            label={t("admin.users.details.updated")}
            value={formatAdminDate(user.updatedAt)}
          />
        </div>
      </AdminDetailSection>
    </div>
  );
}

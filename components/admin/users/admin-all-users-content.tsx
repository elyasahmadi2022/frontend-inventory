"use client";

import { AdminStatCard } from "@/components/admin/admin-page-header";
import { AdminUsersTable } from "@/components/admin/users/admin-users-table";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAdminUsersQuery } from "@/lib/query/hooks";
import { gooeyToast } from "goey-toast";
import { Users } from "lucide-react";
import { useEffect } from "react";



export function AdminAllUsersContent() {
  const { t } = useI18n();
  const {
    data: users = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAdminUsersQuery("all");

  const loading = isLoading;
  const refreshing = isFetching && !isLoading;

  useEffect(() => {
    if (!isError) return;
    gooeyToast.error(t("admin.users.toast.loadFailedTitle"), {
      description:
        error instanceof ApiError
          ? error.message
          : t("admin.users.toast.loadFailedFallback"),
    });
  }, [error, isError, t]);

  const activeCount = users.filter((user) => !user.isDeleted).length;
  const disabledCount = users.filter((user) => user.isDeleted).length;

  return (
    <div className="space-y-1">
      <div className="grid gap-1 sm:grid-cols-3">
        <AdminStatCard
          label={t("admin.users.stats.loaded")}
          value={users.length}
          icon={<Users className="size-5" aria-hidden="true" />}
        />
        <AdminStatCard
          label={t("admin.users.status.active")}
          value={activeCount}
          icon={<Users className="size-5" aria-hidden="true" />}
          tone="success"
        />
        <AdminStatCard
          label={t("admin.users.status.disabled")}
          value={disabledCount}
          icon={<Users className="size-5" aria-hidden="true" />}
          tone="neutral"
        />
      </div>
      <AdminUsersTable
        items={users}
        loading={loading}
        refreshing={refreshing}
        onRefresh={() => void refetch()}
      />
    </div>
  );
}

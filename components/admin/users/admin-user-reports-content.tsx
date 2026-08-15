"use client";
import { gooeyToast } from "goey-toast";

import Link from "next/link";
import { Info } from "lucide-react";
import { useEffect } from "react";
import {
  AdminDetailPageSkeleton,
  AdminDetailToolbar,
  AdminRecordNotFound,
} from "@/components/admin/admin-detail-layout";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ApiError } from "@/lib/api";
import { useAdminUserQuery } from "@/lib/query/hooks";
import { appRoutes } from "@/routes/app-routes";

type AdminUserReportsContentProps = {
  userId: number;
  backHref?: string;
  backLabel?: string;
};

export function AdminUserReportsContent({
  userId,
  backHref = appRoutes.adminUsers,
  backLabel = "Back to all users",
}: AdminUserReportsContentProps) {
  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminUserQuery(userId);

  useEffect(() => {
    if (!isError) return;
    gooeyToast.error("User reports", {
        description: error instanceof ApiError ? error.message : "Could not load user.",
      })
  }, [error, isError]);

  if (isLoading) {
    return <AdminDetailPageSkeleton />;
  }

  if (isError || !user) {
    return (
      <AdminRecordNotFound
        backHref={backHref}
        backLabel={backLabel}
        message="User could not be loaded."
      />
    );
  }

  return (
    <div className="space-y-2">
      <AdminDetailToolbar
        backHref={backHref}
        backLabel={backLabel}
        onRefresh={() => void refetch()}
        actions={
          <>
            <Link
              href={appRoutes.adminUserDetails(user.id)}
              className="inline-flex items-center gap-1.5 border border-light-border bg-light-bg px-3 py-2 text-xs font-semibold text-light-text transition hover:bg-light-surface dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:hover:bg-dark-surface"
            >
              <Info className="size-3.5" />
              View details
            </Link>
          </>
        }
      />

      <AdminPageHeader
        eyebrow={`User #${user.id}`}
        title={`User reports · ${user.name}`}
        description="Store activity and audit history for this user."
      />

      <div className="border border-light-border bg-light-surface p-5 text-sm text-light-muted dark:border-dark-border dark:bg-dark-surface dark:text-dark-muted">
        Detailed per-user reports will be connected to the store reporting API.
        The current reports module already covers accounting, inventory, sales,
        purchases, and transfers.
      </div>
    </div>
  );
}

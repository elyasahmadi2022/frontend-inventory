import type { ReactNode } from "react";
import { Suspense } from "react";
import { AdminDetailPageSkeleton } from "@/components/admin/admin-detail-layout";

export function AdminDetailPageFallback() {
  return (
    <div className="space-y-2">
      <AdminDetailPageSkeleton />
    </div>
  );
}

export function withAdminDetailSuspense(children: ReactNode) {
  return <Suspense fallback={<AdminDetailPageFallback />}>{children}</Suspense>;
}

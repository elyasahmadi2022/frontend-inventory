import { Suspense } from "react";
import { AdminDetailPageFallback } from "@/components/admin/admin-detail-page-shell";
import AdminUserReportsPageClient from "./user-reports-client";

export default function AdminSettingsUserReportsPage() {
  return (
    <Suspense fallback={<AdminDetailPageFallback />}>
      <AdminUserReportsPageClient />
    </Suspense>
  );
}

import { Suspense } from "react";
import { AdminDetailPageFallback } from "@/components/admin/admin-detail-page-shell";
import AdminUserDetailsPageClient from "./user-details-client";

export default function AdminSettingsUserDetailsPage() {
  return (
    <Suspense fallback={<AdminDetailPageFallback />}>
      <AdminUserDetailsPageClient />
    </Suspense>
  );
}

import { Suspense } from "react";
import { AdminDetailPageFallback } from "@/components/admin/admin-detail-page-shell";
import AdminAccountDetailsPageClient from "./account-details-client";

export default function AdminAccountDetailsPage() {
  return (
    <Suspense fallback={<AdminDetailPageFallback />}>
      <AdminAccountDetailsPageClient />
    </Suspense>
  );
}

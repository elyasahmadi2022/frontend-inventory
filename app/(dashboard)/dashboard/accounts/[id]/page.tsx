import { Suspense } from "react";
import { AdminDetailPageFallback } from "@/components/admin/admin-detail-page-shell";
import DashboardAccountDetailsPageClient from "./account-details-client";

export default function DashboardAccountDetailsPage() {
  return (
    <Suspense fallback={<AdminDetailPageFallback />}>
      <DashboardAccountDetailsPageClient />
    </Suspense>
  );
}

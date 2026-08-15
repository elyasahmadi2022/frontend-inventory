import { Suspense } from "react";
import { AdminDetailPageFallback } from "@/components/admin/admin-detail-page-shell";
import AdminPurchasePartnerDetailsPageClient from "../purchase-partner-details-client";

export default function AdminPurchaseBillDetailsPage() {
  return (
    <Suspense fallback={<AdminDetailPageFallback />}>
      <AdminPurchasePartnerDetailsPageClient />
    </Suspense>
  );
}

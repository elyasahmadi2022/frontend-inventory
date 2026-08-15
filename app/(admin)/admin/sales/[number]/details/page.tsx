import { Suspense } from "react";
import { AdminDetailPageFallback } from "@/components/admin/admin-detail-page-shell";
import AdminSalePartnerDetailsPageClient from "../sale-partner-details-client";

export default function AdminSaleInvoiceDetailsPage() {
  return (
    <Suspense fallback={<AdminDetailPageFallback />}>
      <AdminSalePartnerDetailsPageClient />
    </Suspense>
  );
}

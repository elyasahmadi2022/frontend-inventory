import { Suspense } from "react";
import { AdminDetailPageFallback } from "@/components/admin/admin-detail-page-shell";
import DashboardSaleInvoicePageClient from "./sale-invoice-client";

export default function DashboardSaleInvoicePage() {
  return (
    <Suspense fallback={<AdminDetailPageFallback />}>
      <DashboardSaleInvoicePageClient />
    </Suspense>
  );
}

import { Suspense } from "react";
import { AdminDetailPageFallback } from "@/components/admin/admin-detail-page-shell";
import AdminSaleInvoicePageClient from "./sale-invoice-client";

export default function AdminSaleInvoicePage() {
  return (
    <Suspense fallback={<AdminDetailPageFallback />}>
      <AdminSaleInvoicePageClient />
    </Suspense>
  );
}

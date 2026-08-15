import { Suspense } from "react";
import { AdminDetailPageFallback } from "@/components/admin/admin-detail-page-shell";
import AdminPurchaseBillPageClient from "./purchase-bill-client";

export default function AdminPurchaseBillPage() {
  return (
    <Suspense fallback={<AdminDetailPageFallback />}>
      <AdminPurchaseBillPageClient />
    </Suspense>
  );
}

import { Suspense } from "react";
import { AdminDetailPageFallback } from "@/components/admin/admin-detail-page-shell";
import DashboardPurchaseBillPageClient from "./purchase-bill-client";

export default function DashboardPurchaseBillPage() {
  return (
    <Suspense fallback={<AdminDetailPageFallback />}>
      <DashboardPurchaseBillPageClient />
    </Suspense>
  );
}

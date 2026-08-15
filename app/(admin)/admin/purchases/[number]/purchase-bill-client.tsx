"use client";

import { useParams } from "next/navigation";
import { AdminInvalidIdState } from "@/components/admin/admin-detail-layout";
import { AdminPurchaseBillContent } from "@/components/admin/purchases/admin-purchase-bill-content";
import { parseAdminRouteStringId } from "@/lib/admin/parse-route-id";

export default function AdminPurchaseBillPageClient() {
  const params = useParams();
  const number = parseAdminRouteStringId(params?.number);

  if (!number) return <AdminInvalidIdState label="bill number" />;

  return <AdminPurchaseBillContent number={number} />;
}

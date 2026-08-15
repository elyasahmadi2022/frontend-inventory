"use client";

import { useParams } from "next/navigation";
import { AdminInvalidIdState } from "@/components/admin/admin-detail-layout";
import { AdminSaleInvoiceContent } from "@/components/admin/sales/admin-sale-invoice-content";
import { parseAdminRouteStringId } from "@/lib/admin/parse-route-id";

export default function AdminSaleInvoicePageClient() {
  const params = useParams();
  const number = parseAdminRouteStringId(params?.number);

  if (!number) return <AdminInvalidIdState label="invoice number" />;

  return <AdminSaleInvoiceContent number={number} />;
}

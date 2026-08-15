"use client";

import { useParams } from "next/navigation";
import { AdminInvalidIdState } from "@/components/admin/admin-detail-layout";
import { AdminTradePartnerDetails } from "@/components/admin/shared/admin-trade-partner-details";
import { parseAdminRouteStringId } from "@/lib/admin/parse-route-id";

export default function AdminSalePartnerDetailsPageClient() {
  const params = useParams();
  const number = parseAdminRouteStringId(params?.number);

  if (!number) return <AdminInvalidIdState label="invoice number" />;

  return <AdminTradePartnerDetails kind="sale" number={number} />;
}

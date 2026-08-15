"use client";

import { useParams } from "next/navigation";
import { AdminInvalidIdState } from "@/components/admin/admin-detail-layout";
import { AdminAccountDetailsContent } from "@/components/admin/accounts/admin-account-details-content";
import {
  isValidAdminRouteStringId,
  parseAdminRouteStringId,
} from "@/lib/admin/parse-route-id";

export default function DashboardAccountDetailsPageClient() {
  const params = useParams();
  const accountCode = parseAdminRouteStringId(params?.id);

  if (!isValidAdminRouteStringId(accountCode)) {
    return <AdminInvalidIdState label="account code" />;
  }

  return <AdminAccountDetailsContent accountCode={accountCode} />;
}

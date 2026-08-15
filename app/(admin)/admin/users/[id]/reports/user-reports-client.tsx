"use client";

import { useParams } from "next/navigation";
import { AdminInvalidIdState } from "@/components/admin/admin-detail-layout";
import { AdminUserDetailsContent } from "@/components/admin/users/admin-user-details-content";
import {
  isValidAdminRouteStringId,
  parseAdminRouteStringId,
} from "@/lib/admin/parse-route-id";

export default function AdminUserReportsPageClient() {
  const params = useParams();
  const userId = parseAdminRouteStringId(params?.id);

  if (!isValidAdminRouteStringId(userId)) {
    return <AdminInvalidIdState label="user" />;
  }

  return <AdminUserDetailsContent userId={userId} />;
}

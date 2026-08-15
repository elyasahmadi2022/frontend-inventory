"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { DashboardNotificationDetailContent } from "@/components/dashboard/dashboard-notification-detail-content";

function DashboardNotificationDetailRouteContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const notificationId = Number.parseInt(String(rawId ?? ""), 10);
  const sourceParam = searchParams.get("source");
  const source = sourceParam === "user" ? "user" : "owner";

  if (!Number.isInteger(notificationId) || notificationId < 1) {
    return (
      <div className="card-surface p-8 text-center text-sm text-muted">
        Invalid notification link.
      </div>
    );
  }

  return (
    <DashboardNotificationDetailContent
      notificationId={notificationId}
      source={source}
    />
  );
}

export default function DashboardNotificationDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="card-surface p-8 text-center text-sm text-muted">
          Loading notification...
        </div>
      }
    >
      <DashboardNotificationDetailRouteContent />
    </Suspense>
  );
}

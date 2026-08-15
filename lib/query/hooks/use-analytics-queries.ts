"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/query/api/analytics.api";
import { queryKeys } from "@/lib/query/query-keys";
import type { AdminDashboardParams } from "@/services/analytics.service";

export function useAdminDashboardQuery(params?: AdminDashboardParams) {
  return useQuery({
    queryKey: queryKeys.analytics.adminDashboard(params),
    queryFn: () => analyticsApi.getAdminDashboardBundle(params),
  });
}

export function useAdminAnalyticsPageQuery() {
  return useQuery({
    queryKey: queryKeys.analytics.adminAnalyticsPage(),
    queryFn: () => analyticsApi.getAdminAnalyticsPageBundle(),
  });
}

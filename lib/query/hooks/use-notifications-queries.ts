"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/query/api/notifications.api";
import { queryKeys } from "@/lib/query/query-keys";

export function useNotificationsQuery(
  params: {
    page: number;
    pageSize: number;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.dashboard.notifications(params),
    queryFn: () => notificationsApi.getNotifications(params),
    enabled,
  });
}

export function useNotificationQuery(
  id: number,
  source: "user" | "owner" = "owner",
) {
  return useQuery({
    queryKey: queryKeys.dashboard.notification(id, source),
    queryFn: () => notificationsApi.getNotification(id, source),
    enabled: id > 0,
  });
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: [...queryKeys.dashboard.all, "notifications"],
    });
}

export function useMarkNotificationReadMutation() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: ({
      id,
      source,
    }: {
      id: number;
      source?: "user" | "owner";
    }) => notificationsApi.markRead(id, source),
    onSuccess: invalidate,
  });
}

export function useMarkAllNotificationsReadMutation() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: invalidate,
  });
}

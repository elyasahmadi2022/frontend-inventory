import { hydrateApiAuthFromStorage } from "@/services/auth-session";
import {
  fetchNotificationById,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications.service";

function ensureAuth() {
  hydrateApiAuthFromStorage();
}

export const notificationsApi = {
  getNotifications: async (params: { page: number; pageSize: number }) => {
    ensureAuth();
    return fetchNotifications(params);
  },

  getNotification: async (id: number, source: "user" | "owner" = "owner") => {
    ensureAuth();
    return fetchNotificationById(id, source);
  },

  getUnreadCount: async () => {
    ensureAuth();
    return fetchUnreadNotificationCount();
  },

  markRead: async (id: number, source: "user" | "owner" = "owner") => {
    ensureAuth();
    return markNotificationRead(id, source);
  },

  markAllRead: async () => {
    ensureAuth();
    return markAllNotificationsRead();
  },
};

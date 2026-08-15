import {
  createAdminUser,
  deleteAdminUser,
  fetchAllAdminUsers,
  fetchAdminUserById,
  requestAdminUserEmailVerification,
  updateAdminUserStatus,
  updateAdminUserEmailVerification,
} from "@/services/admin-users.service";
import {
  countPropertyReportsByUser,
} from "@/services/reports.service";
import { hydrateApiAuthFromStorage } from "@/services/auth-session";

export type ApprovalStatusFilter = "all" ;

function ensureAuth() {
  hydrateApiAuthFromStorage();
}

export const adminApi = {

  getUsers: async (status: "active" | "disabled" | "all") => {
    ensureAuth();
    return fetchAllAdminUsers({ status });
  },

  getUser: async (id: string) => {
    ensureAuth();
    return fetchAdminUserById(id);
  },

  createUser: async (input: Parameters<typeof createAdminUser>[0]) => {
    ensureAuth();
    return createAdminUser(input);
  },

  updateUserStatus: async (
    id: string,
    status: Parameters<typeof updateAdminUserStatus>[1],
  ) => {
    ensureAuth();
    return updateAdminUserStatus(id, status);
  },

  deleteUser: async (id: string) => {
    ensureAuth();
    return deleteAdminUser(id);
  },

  getUserReportCount: async (userId: number) => {
    ensureAuth();
    return countPropertyReportsByUser(userId);
  },

  requestUserEmailVerification: async (
    id: string | number,
    input: Parameters<typeof requestAdminUserEmailVerification>[1],
  ) => {
    ensureAuth();
    return requestAdminUserEmailVerification(String(id), input);
  },

  updateUserEmailVerification: async (
    id: string | number,
    action: Parameters<typeof updateAdminUserEmailVerification>[1],
  ) => {
    ensureAuth();
    return updateAdminUserEmailVerification(String(id), action);
  },

};

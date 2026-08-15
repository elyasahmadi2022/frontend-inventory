import {
  fetchAdminOverview,
  fetchAdminPriceStatistics,
  fetchAdminPropertiesByLocation,
  fetchAdminPropertiesByStatus,
  fetchAdminPropertiesByType,
  fetchAdminPropertyAnalytics,
  fetchAdminStoreDashboard,
  fetchAdminTopOwners,
  fetchAdminUserGrowth,
  fetchOwnerDashboard,
  fetchOwnerPropertiesPerformance,
  fetchOwnerRevenue,
  fetchPublicStatistics,
  type AdminDashboardParams,
} from "@/services/analytics.service";
import { hydrateApiAuthFromStorage } from "@/services/auth-session";

function ensureAuth() {
  hydrateApiAuthFromStorage();
}

export const analyticsApi = {
  getPublicStatistics: () => fetchPublicStatistics(),

  getAdminOverview: async () => {
    ensureAuth();
    return fetchAdminOverview();
  },

  getAdminDashboardBundle: async (params?: AdminDashboardParams) => {
    ensureAuth();
    return fetchAdminStoreDashboard(params);
  },

  getAdminAnalyticsPageBundle: async () => {
    ensureAuth();
    const [
      overview,
      userGrowth,
      propertiesByStatus,
      propertiesByType,
      priceStatistics,
      topOwners,
      propertiesByLocation,
    ] = await Promise.all([
      fetchAdminOverview(),
      fetchAdminUserGrowth(30),
      fetchAdminPropertiesByStatus(),
      fetchAdminPropertiesByType(),
      fetchAdminPriceStatistics(),
      fetchAdminTopOwners(8),
      fetchAdminPropertiesByLocation(),
    ]);
    return {
      overview,
      userGrowth,
      propertiesByStatus,
      propertiesByType,
      priceStatistics,
      topOwners,
      propertiesByLocation,
    };
  },

  getPropertyAnalytics: async (propertyId: number) => {
    ensureAuth();
    return fetchAdminPropertyAnalytics(propertyId);
  },

  getOwnerAnalyticsBundle: async () => {
    ensureAuth();
    const [dashboard, performance, revenue] = await Promise.all([
      fetchOwnerDashboard(),
      fetchOwnerPropertiesPerformance(),
      fetchOwnerRevenue(),
    ]);
    return { dashboard, performance, revenue };
  },
};

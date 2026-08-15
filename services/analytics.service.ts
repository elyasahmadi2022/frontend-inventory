import { apiRequest } from "@/lib/api";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  status: number;
  data?: T;
};

export type PublicStatistics = {
  totalProperties: number;
  totalOwners: number;
  totalCities: number;
};

export type AdminOverview = {
  users: { total: number; newLast30Days: number; newToday?: number };
  owners: { total: number; pending: number };
  properties: {
    total: number;
    active: number;
    sold: number;
    rented: number;
    pending: number;
    newLast30Days: number;
    newToday?: number;
  };
  rentals?: { total: number; newToday?: number };
  moderation: { pendingImages: number; pendingReports: number };
  engagement: { messages: number; favorites: number; views: number };
};

export type MarketplaceActivityPoint = {
  date: string;
  day: string;
  properties: number;
  users: number;
  agencies: number;
  inquiries: number;
};

export type AdminPlatformNotification = {
  id: string;
  type: string;
  title: string;
  meta: string;
  time: string;
};

export type AdminTopOwner = {
  ownerId: number;
  ownerName: string;
  ownerEmail: string;
  totalProperties: number;
  activeProperties: number;
  soldProperties: number;
  rentedProperties: number;
  totalViews: number;
  score: number;
};

export type AdminLocationInsight = {
  city: string;
  province: string;
  count: number;
};

export type OwnerDashboardStats = {
  properties: {
    total: number;
    active: number;
    sold: number;
    rented: number;
    pending: number;
    rejected: number;
  };
  engagement: {
    totalViews: number;
    viewsLast7Days: number;
    favorites: number;
    messages: number;
  };
};

export type OwnerPropertyPerformance = {
  id: number;
  title: string;
  price: number;
  views: number;
  status: string;
  listingStatus: string;
  createdAt: string;
  favorites: number;
  messages: number;
  engagementScore: number;
};

export type GrowthPoint = {
  date: string;
  users: number;
  properties: number;
};

export type CurrencyTotal = {
  currencyCode: string;
  total: number;
};

export type AdminDashboardParams = {
  from?: string;
  to?: string;
};

export type AdminDashboardAccountRef = {
  id: string;
  code: string;
  name: string;
  type: string;
};

export type AdminStoreDashboard = {
  generatedAt: string;
  users: { total: number };
  accounts: {
    counts: {
      total: number;
      active: number;
      assets: number;
      liabilities: number;
      equity: number;
      revenue: number;
      expenses: number;
      cash: number;
    };
    balances: {
      assets: CurrencyTotal[];
      liabilities: CurrencyTotal[];
      equity: CurrencyTotal[];
      revenue: CurrencyTotal[];
      expenses: CurrencyTotal[];
      cash: CurrencyTotal[];
    };
  };
  ledger: {
    journals: Record<string, number>;
    journalLines: number;
    accountBalances: number;
    partnerLedgerAccounts: number;
    recentTransactions: Array<{
      id: string;
      number: string;
      entryDate: string;
      description: string;
      reason?: string | null;
      sourceType: string;
      sourceId?: string | null;
      payerAccount?: AdminDashboardAccountRef | null;
      receiverAccount?: AdminDashboardAccountRef | null;
      debitTotal: number;
      creditTotal: number;
      currencyTotals: Array<{
        currencyCode: string;
        debit: number;
        credit: number;
      }>;
      lines: Array<{
        id: string;
        lineNo: number;
        account: AdminDashboardAccountRef;
        partner?: { id: string; code: string; name: string } | null;
        currencyCode: string;
        debit: number;
        credit: number;
        memo?: string | null;
      }>;
    }>;
  };
  partners: {
    total: number;
    active: number;
    byType: Record<string, number>;
  };
  inventory: {
    products: number;
    activeProducts: number;
    locationsWithStock: number;
    lowStockProducts: number;
    costValue: number;
  };
  sales: {
    invoices: number;
    posted: number;
    totals: CurrencyTotal[];
    outstanding: CurrencyTotal[];
  };
  purchases: {
    bills: number;
    posted: number;
    totals: CurrencyTotal[];
    outstanding: CurrencyTotal[];
  };
  payments: {
    count: number;
    totals: CurrencyTotal[];
  };
  transfers: {
    count: number;
    posted: number;
    totals: CurrencyTotal[];
  };
};

export type PropertyViewDailyPoint = {
  date: string;
  views: number;
};

export type AdminPropertyAnalytics = {
  propertyId: number;
  title: string;
  analytics: {
    views: {
      total: number;
      last7Days: number;
      last30Days: number;
      daily: PropertyViewDailyPoint[];
    };
    engagement: {
      favorites: number;
      messages: number;
    };
    performance: {
      avgViewsPerDay: string;
      conversionRate: string;
    };
  };
};

export function formatPropertyViewsChartData(
  daily: PropertyViewDailyPoint[],
): { label: string; views: number }[] {
  return daily.map((point) => ({
    label: new Date(`${point.date}T00:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    views: point.views,
  }));
}

export async function fetchAdminPropertyAnalytics(
  propertyId: number,
): Promise<AdminPropertyAnalytics | null> {
  const response = await apiRequest<
    ApiEnvelope<AdminPropertyAnalytics>
  >(`/api/v1/analytics/admin/property/${propertyId}`, { method: "GET" });
  return response.data ?? null;
}

export async function fetchOwnerPropertyAnalytics(
  propertyId: number,
): Promise<AdminPropertyAnalytics | null> {
  const response = await apiRequest<
    ApiEnvelope<AdminPropertyAnalytics>
  >(`/api/v1/analytics/owner/property/${propertyId}`, { method: "GET" });
  return response.data ?? null;
}

export async function fetchPublicStatistics(): Promise<PublicStatistics> {
  const response = await apiRequest<
    ApiEnvelope<{ statistics: PublicStatistics }>
  >("/api/v1/analytics/public/statistics", {
    method: "GET",
    skipAuth: true,
  });
  return (
    response.data?.statistics ?? {
      totalProperties: 0,
      totalOwners: 0,
      totalCities: 0,
    }
  );
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const response = await apiRequest<ApiEnvelope<{ overview: AdminOverview }>>(
    "/api/v1/analytics/admin/overview",
    { method: "GET" },
  );
  return (
    response.data?.overview ?? {
      users: { total: 0, newLast30Days: 0, newToday: 0 },
      owners: { total: 0, pending: 0 },
      properties: {
        total: 0,
        active: 0,
        sold: 0,
        rented: 0,
        pending: 0,
        newLast30Days: 0,
        newToday: 0,
      },
      rentals: { total: 0, newToday: 0 },
      moderation: { pendingImages: 0, pendingReports: 0 },
      engagement: { messages: 0, favorites: 0, views: 0 },
    }
  );
}

function buildAdminDashboardQuery(params: AdminDashboardParams) {
  const searchParams = new URLSearchParams();
  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function fetchAdminStoreDashboard(
  params: AdminDashboardParams = {},
): Promise<AdminStoreDashboard> {
  const response = await apiRequest<{ dashboard?: AdminStoreDashboard }>(
    `/api/dashboard/admin${buildAdminDashboardQuery(params)}`,
    { method: "GET" },
  );
  return (
    response.dashboard ?? {
      generatedAt: new Date().toISOString(),
      users: { total: 0 },
      accounts: {
        counts: {
          total: 0,
          active: 0,
          assets: 0,
          liabilities: 0,
          equity: 0,
          revenue: 0,
          expenses: 0,
          cash: 0,
        },
        balances: {
          assets: [],
          liabilities: [],
          equity: [],
          revenue: [],
          expenses: [],
          cash: [],
        },
      },
      ledger: {
        journals: {},
        journalLines: 0,
        accountBalances: 0,
        partnerLedgerAccounts: 0,
        recentTransactions: [],
      },
      partners: { total: 0, active: 0, byType: {} },
      inventory: {
        products: 0,
        activeProducts: 0,
        locationsWithStock: 0,
        lowStockProducts: 0,
        costValue: 0,
      },
      sales: { invoices: 0, posted: 0, totals: [], outstanding: [] },
      purchases: { bills: 0, posted: 0, totals: [], outstanding: [] },
      payments: { count: 0, totals: [] },
      transfers: { count: 0, posted: 0, totals: [] },
    }
  );
}

export async function fetchAdminMarketplaceActivity(
  days = 30,
): Promise<MarketplaceActivityPoint[]> {
  const response = await apiRequest<
    ApiEnvelope<{ activity: MarketplaceActivityPoint[] }>
  >(`/api/v1/analytics/admin/marketplace-activity?days=${days}`, {
    method: "GET",
  });
  return response.data?.activity ?? [];
}

export async function fetchAdminNotifications(
  limit = 10,
): Promise<AdminPlatformNotification[]> {
  const response = await apiRequest<
    ApiEnvelope<{ notifications: AdminPlatformNotification[] }>
  >(`/api/v1/analytics/admin/notifications?limit=${limit}`, {
    method: "GET",
  });
  return response.data?.notifications ?? [];
}

export async function fetchAdminPropertiesByLocation(): Promise<{
  byProvince: { province: string; count: number }[];
  topCities: AdminLocationInsight[];
}> {
  const response = await apiRequest<
    ApiEnvelope<{
      byProvince: { province: string; count: number }[];
      topCities: AdminLocationInsight[];
    }>
  >("/api/v1/analytics/admin/properties-by-location", { method: "GET" });
  return {
    byProvince: response.data?.byProvince ?? [],
    topCities: response.data?.topCities ?? [],
  };
}

export async function fetchAdminTopOwners(
  limit = 10,
): Promise<AdminTopOwner[]> {
  const response = await apiRequest<
    ApiEnvelope<{ topOwners: AdminTopOwner[] }>
  >(`/api/v1/analytics/admin/top-owners?limit=${limit}`, { method: "GET" });
  return response.data?.topOwners ?? [];
}

export function buildGeoInsightsFromCities(
  cities: AdminLocationInsight[],
  maxItems = 6,
): { city: string; properties: number; share: number }[] {
  const top = cities.slice(0, maxItems);
  const total = top.reduce((sum, row) => sum + row.count, 0);
  if (total <= 0) return [];
  return top.map((row) => ({
    city: row.province ? `${row.city}, ${row.province}` : row.city,
    properties: row.count,
    share: Math.round((row.count / total) * 100),
  }));
}

export const LISTING_STATUS_CHART_COLORS: Record<string, string> = {
  active: "#6366f1",
  sold: "#10b981",
  rented: "#0ea5e9",
  leased: "#0ea5e9",
  pending: "#f59e0b",
  rejected: "#ef4444",
  draft: "#94a3b8",
};

export function buildListingStatusChartData(
  items: { listingStatus: string; count: number }[],
): { name: string; value: number; color: string }[] {
  return items
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: item.listingStatus.replace(/_/g, " "),
      value: item.count,
      color:
        LISTING_STATUS_CHART_COLORS[item.listingStatus.toLowerCase()] ??
        "#64748b",
    }));
}

export async function fetchAdminUserGrowth(
  days = 30,
): Promise<GrowthPoint[]> {
  const response = await apiRequest<ApiEnvelope<{ growth: GrowthPoint[] }>>(
    `/api/v1/analytics/admin/user-growth?days=${days}`,
    { method: "GET" },
  );
  return response.data?.growth ?? [];
}

export async function fetchAdminPropertiesByStatus(): Promise<{
  byStatus: { status: string; count: number }[];
  byListingStatus: { listingStatus: string; count: number }[];
}> {
  const response = await apiRequest<
    ApiEnvelope<{
      byStatus: { status: string; count: number }[];
      byListingStatus: { listingStatus: string; count: number }[];
    }>
  >("/api/v1/analytics/admin/properties-by-status", { method: "GET" });
  return {
    byStatus: response.data?.byStatus ?? [],
    byListingStatus: response.data?.byListingStatus ?? [],
  };
}

export async function fetchAdminPropertiesByType(): Promise<{
  byPropertyType: { type: string; count: number }[];
  byTransactionType: { type: string; count: number }[];
}> {
  const response = await apiRequest<
    ApiEnvelope<{
      byPropertyType: { type: string; count: number }[];
      byTransactionType: { type: string; count: number }[];
    }>
  >("/api/v1/analytics/admin/properties-by-type", { method: "GET" });
  return {
    byPropertyType: response.data?.byPropertyType ?? [],
    byTransactionType: response.data?.byTransactionType ?? [],
  };
}

export async function fetchAdminPriceStatistics(): Promise<{
  overall: {
    average: number;
    minimum: number;
    maximum: number;
    total: number;
  };
  byTransactionType: Record<
    string,
    { avg: number; min: number; max: number; count: number }
  >;
}> {
  const response = await apiRequest<
    ApiEnvelope<{
      overall: {
        average: number;
        minimum: number;
        maximum: number;
        total: number;
      };
      byTransactionType: Record<
        string,
        { avg: number; min: number; max: number; count: number }
      >;
    }>
  >("/api/v1/analytics/admin/price-statistics", { method: "GET" });
  return (
    response.data ?? {
      overall: { average: 0, minimum: 0, maximum: 0, total: 0 },
      byTransactionType: {},
    }
  );
}

export async function fetchOwnerDashboard(): Promise<OwnerDashboardStats> {
  const response = await apiRequest<
    ApiEnvelope<{ dashboard: OwnerDashboardStats }>
  >("/api/v1/analytics/owner/dashboard", { method: "GET" });
  return (
    response.data?.dashboard ?? {
      properties: {
        total: 0,
        active: 0,
        sold: 0,
        rented: 0,
        pending: 0,
        rejected: 0,
      },
      engagement: {
        totalViews: 0,
        viewsLast7Days: 0,
        favorites: 0,
        messages: 0,
      },
    }
  );
}

export async function fetchOwnerPropertiesPerformance(): Promise<
  OwnerPropertyPerformance[]
> {
  const response = await apiRequest<
    ApiEnvelope<{ properties: OwnerPropertyPerformance[] }>
  >("/api/v1/analytics/owner/properties-performance", { method: "GET" });
  return response.data?.properties ?? [];
}

export async function fetchOwnerRevenue(): Promise<{
  total: number;
  transactions: number;
  properties: {
    id: number;
    title: string;
    listingStatus: string;
    closingPrice: number | null;
    closingDate: string | null;
  }[];
}> {
  const response = await apiRequest<
    ApiEnvelope<{
      revenue: {
        total: number;
        transactions: number;
        properties: {
          id: number;
          title: string;
          listingStatus: string;
          closingPrice: number | null;
          closingDate: string | null;
        }[];
      };
    }>
  >("/api/v1/analytics/owner/revenue", { method: "GET" });
  return (
    response.data?.revenue ?? {
      total: 0,
      transactions: 0,
      properties: [],
    }
  );
}


export const queryKeys = {

  analytics: {
    all: ["analytics"] as const,
    publicStatistics: () =>
      [...queryKeys.analytics.all, "public-statistics"] as const,
    adminOverview: () =>
      [...queryKeys.analytics.all, "admin-overview"] as const,
    adminDashboard: (params?: unknown) =>
      [...queryKeys.analytics.all, "admin-dashboard", params ?? {}] as const,
    adminAnalyticsPage: () =>
      [...queryKeys.analytics.all, "admin-analytics-page"] as const,
    marketplaceActivity: (days: number) =>
      [...queryKeys.analytics.all, "marketplace-activity", days] as const,
    adminNotifications: (limit: number) =>
      [...queryKeys.analytics.all, "admin-notifications", limit] as const,
    propertiesByLocation: () =>
      [...queryKeys.analytics.all, "properties-by-location"] as const,
    propertiesByStatus: () =>
      [...queryKeys.analytics.all, "properties-by-status"] as const,
    propertiesByType: () =>
      [...queryKeys.analytics.all, "properties-by-type"] as const,
    priceStatistics: () =>
      [...queryKeys.analytics.all, "price-statistics"] as const,
    topOwners: (limit: number) =>
      [...queryKeys.analytics.all, "top-owners", limit] as const,
    userGrowth: (days: number) =>
      [...queryKeys.analytics.all, "user-growth", days] as const,
    propertyAnalytics: (propertyId: number) =>
      [...queryKeys.analytics.all, "property", propertyId] as const,
    ownerDashboard: () =>
      [...queryKeys.analytics.all, "owner-dashboard"] as const,
    ownerPerformance: () =>
      [...queryKeys.analytics.all, "owner-performance"] as const,
    ownerRevenue: () => [...queryKeys.analytics.all, "owner-revenue"] as const,
    ownerAnalyticsBundle: () =>
      [...queryKeys.analytics.all, "owner-analytics-bundle"] as const,
  },
  admin: {
    all: ["admin"] as const,
    moderationProperties: (status: string) =>
      [...queryKeys.admin.all, "moderation-properties", status] as const,
    catalog: () => [...queryKeys.admin.all, "catalog"] as const,
    category: (id: number) => [...queryKeys.admin.all, "category", id] as const,
    categoryPropertyTypes: (id: number) =>
      [...queryKeys.admin.all, "category", id, "property-types"] as const,
    featuredRequests: () =>
      [...queryKeys.admin.all, "featured-requests"] as const,
    promotionPlans: () => [...queryKeys.admin.all, "promotion-plans"] as const,
    paymentTransactions: (status: string) =>
      [...queryKeys.admin.all, "payment-transactions", status] as const,
    storeSettings: () => [...queryKeys.admin.all, "store-settings"] as const,
    users: (status: string) =>
      [...queryKeys.admin.all, "users", status] as const,
    user: (id: string | number) => [...queryKeys.admin.all, "user", id] as const,
    userReportCount: (id: number) =>
      [...queryKeys.admin.all, "user", id, "report-count"] as const,
    owners: (status: string) =>
      [...queryKeys.admin.all, "owners", status] as const,
    owner: (id: number) => [...queryKeys.admin.all, "owner", id] as const,
    ownerProperties: (
      ownerId: number,
      params: { status: string; limit: number },
    ) =>
      [...queryKeys.admin.all, "owner", ownerId, "properties", params] as const,
    property: (id: number) => [...queryKeys.admin.all, "property", id] as const,
    propertyReports: (params: { page: number; pageSize: number }) =>
      [...queryKeys.admin.all, "property-reports", params] as const,
    articles: (status: string) =>
      [...queryKeys.admin.all, "articles", status] as const,
    article: (id: number) => [...queryKeys.admin.all, "article", id] as const,
    articleCategories: () =>
      [...queryKeys.admin.all, "article-categories"] as const,
    products: (params: unknown) =>
      [...queryKeys.admin.all, "products", params] as const,
    productCategories: () =>
      [...queryKeys.admin.all, "product-categories"] as const,
    productUnits: () => [...queryKeys.admin.all, "product-units"] as const,
    inventoryLocations: () =>
      [...queryKeys.admin.all, "inventory-locations"] as const,
    sales: (params: unknown) =>
      [...queryKeys.admin.all, "sales", params] as const,
    sale: (number: string) =>
      [...queryKeys.admin.all, "sale", number] as const,
    saleCustomers: () => [...queryKeys.admin.all, "sale-customers"] as const,
    saleAccounts: (types: readonly string[]) =>
      [...queryKeys.admin.all, "sale-accounts", types] as const,
    purchases: (params: unknown) =>
      [...queryKeys.admin.all, "purchases", params] as const,
    purchase: (number: string) =>
      [...queryKeys.admin.all, "purchase", number] as const,
    purchaseVendors: () =>
      [...queryKeys.admin.all, "purchase-vendors"] as const,
    partners: (params: unknown) =>
      [...queryKeys.admin.all, "partners", params] as const,
    accounts: (params: unknown) =>
      [...queryKeys.admin.all, "accounts", params] as const,
    account: (id: string | number) =>
      [...queryKeys.admin.all, "account", id] as const,
    transfers: (params: unknown) =>
      [...queryKeys.admin.all, "transfers", params] as const,
    dailyReport: (date?: string) =>
      [...queryKeys.admin.all, "daily-report", date ?? "today"] as const,
    monthlyReport: (year: number, month: number) =>
      [...queryKeys.admin.all, "monthly-report", year, month] as const,
    journalReport: (params: unknown) =>
      [...queryKeys.admin.all, "journal-report", params] as const,
    accountLedger: (params: unknown) =>
      [...queryKeys.admin.all, "account-ledger", params] as const,
    financialSummary: (params: unknown) =>
      [...queryKeys.admin.all, "financial-summary", params] as const,
    incomeStatement: (params: unknown) =>
      [...queryKeys.admin.all, "income-statement", params] as const,
    balanceSheet: (asOf?: string) =>
      [...queryKeys.admin.all, "balance-sheet", asOf ?? "today"] as const,
    accountBalances: (currencyCode?: string) =>
      [...queryKeys.admin.all, "account-balances", currencyCode ?? "all"] as const,
    cashBalances: () => [...queryKeys.admin.all, "cash-balances"] as const,
    inventoryBalances: () => [...queryKeys.admin.all, "inventory-balances"] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    myProperties: (page: number, pageSize: number) =>
      [
        ...queryKeys.dashboard.all,
        "my-properties",
        { page, pageSize },
      ] as const,
    myProperty: (id: number) =>
      [...queryKeys.dashboard.all, "my-property", id] as const,
    myArticles: (page: number, limit: number) =>
      [...queryKeys.dashboard.all, "my-articles", { page, limit }] as const,
    myArticle: (id: number) =>
      [...queryKeys.dashboard.all, "my-article", id] as const,
    articleCategories: () =>
      [...queryKeys.dashboard.all, "article-categories"] as const,
    favorites: (page: number, pageSize: number) =>
      [...queryKeys.dashboard.all, "favorites", { page, pageSize }] as const,
    notifications: (params: { page: number; pageSize: number }) =>
      [...queryKeys.dashboard.all, "notifications", params] as const,
    notification: (id: number, source?: string) =>
      [...queryKeys.dashboard.all, "notification", id, source ?? ""] as const,
    userAddress: () => [...queryKeys.dashboard.all, "user-address"] as const,
  },
  auth: {
    all: ["auth"] as const,
    emailVerification: () =>
      [...queryKeys.auth.all, "email-verification"] as const,
  },
} as const;

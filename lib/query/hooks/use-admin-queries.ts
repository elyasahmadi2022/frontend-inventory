"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/query/api/admin.api";
import { queryKeys } from "@/lib/query/query-keys";
import {
  createInventoryTransfer,
  createInventoryLocation,
  createProduct,
  createProductCategory,
  deleteInventoryLocation,
  deleteProduct,
  deleteProductCategory,
  fetchInventoryLocations,
  fetchProductCategories,
  fetchProducts,
  fetchUnits,
  updateProduct,
  updateProductCategory,
  type ProductListParams,
  type SaveInventoryTransferInput,
  type SaveInventoryLocationInput,
  type SaveProductCategoryInput,
  type SaveProductInput,
} from "@/services/products.service";
import {
  createAccount,
  deleteAccount,
  fetchAccount,
  fetchAccountByCode,
  fetchAccounts,
  fetchAccountsPage,
  recordExpense,
  recordFunding,
  updateAccount,
  type AccountListParams,
  type AccountType,
  type CurrencyCode,
  type RecordExpenseInput,
  type RecordFundingInput,
  type SaveAccountInput,
} from "@/services/accounts.service";
import { fetchCurrencies } from "@/services/currencies.service";
import {
  createPartner,
  createPartnerLedgerAccount,
  deletePartner,
  fetchPartners,
  fetchPurchaseVendors,
  fetchSaleCustomers,
  updatePartner,
  type PartnerListParams,
  type SavePartnerInput,
  type SavePartnerLedgerAccountInput,
  type UpdatePartnerInput,
} from "@/services/partners.service";
import {
  cancelSale,
  createSale,
  fetchSale,
  fetchSales,
  receiveSalePayment,
  returnSaleProducts,
  updateSale,
  type SaleListParams,
  type SalePaymentInput,
  type SaleReturnInput,
  type SaveSaleInput,
} from "@/services/sales.service";
import {
  cancelPurchase,
  createPurchase,
  fetchPurchase,
  fetchPurchases,
  payPurchaseBill,
  returnPurchaseProducts,
  updatePurchase,
  type PurchaseListParams,
  type PurchasePaymentInput,
  type PurchaseReturnInput,
  type SavePurchaseInput,
} from "@/services/purchases.service";
import {
  createTransfer,
  fetchTransfers,
  type SaveTransferInput,
  type TransferListParams,
} from "@/services/transfers.service";
import {
  fetchAccountBalances,
  fetchAccountLedger,
  fetchBalanceSheet,
  fetchCashBalances,
  fetchDailyReport,
  fetchFinancialSummary,
  fetchIncomeStatement,
  fetchInventoryBalances,
  fetchJournalReport,
  fetchMonthlyReport,
  type AccountLedgerParams,
  type DateRangeParams,
  type JournalReportParams,
} from "@/services/reports-admin.service";
import { fetchStoreSettings } from "@/services/admin-settings.service";
import { fetchOperations, type OperationListParams } from "@/services/operations.service";


export function useStoreSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.admin.storeSettings(),
    queryFn: fetchStoreSettings,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminProductsQuery(params: ProductListParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.products(params),
    queryFn: () => fetchProducts(params),
  });
}

export function useAdminProductCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.admin.productCategories(),
    queryFn: fetchProductCategories,
  });
}

export function useAdminProductUnitsQuery() {
  return useQuery({
    queryKey: queryKeys.admin.productUnits(),
    queryFn: fetchUnits,
  });
}

export function useAdminInventoryLocationsQuery() {
  return useQuery({
    queryKey: queryKeys.admin.inventoryLocations(),
    queryFn: fetchInventoryLocations,
  });
}

export function useCreateAdminInventoryLocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveInventoryLocationInput) => createInventoryLocation(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.inventoryLocations(),
      });
    },
  });
}

export function useAdminSalesQuery(params: SaleListParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.sales(params),
    queryFn: () => fetchSales(params),
  });
}

export function useAdminSaleQuery(identifier: string) {
  return useQuery({
    queryKey: queryKeys.admin.sale(identifier),
    queryFn: () => fetchSale(identifier),
    enabled: Boolean(identifier),
  });
}

export function useAdminSaleCustomersQuery() {
  return useQuery({
    queryKey: queryKeys.admin.saleCustomers(),
    queryFn: fetchSaleCustomers,
  });
}

export function useAdminPurchasesQuery(params: PurchaseListParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.purchases(params),
    queryFn: () => fetchPurchases(params),
  });
}

export function useAdminPurchaseQuery(identifier: string) {
  return useQuery({
    queryKey: queryKeys.admin.purchase(identifier),
    queryFn: () => fetchPurchase(identifier),
    enabled: Boolean(identifier),
  });
}

export function useAdminPurchaseVendorsQuery() {
  return useQuery({
    queryKey: queryKeys.admin.purchaseVendors(),
    queryFn: fetchPurchaseVendors,
  });
}

export function useAdminPartnersQuery(params: PartnerListParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.partners(params),
    queryFn: () => fetchPartners(params),
  });
}

export function useAdminSaleAccountsQuery(types: AccountType[]) {
  return useQuery({
    queryKey: queryKeys.admin.saleAccounts(types),
    queryFn: async () => {
      const groups = await Promise.all(
        types.map((type) => fetchAccounts({ type, isActive: true, limit: 100 })),
      );
      return groups.flat();
    },
  });
}

export function useAdminAccountsQuery(params: AccountListParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.accounts(params),
    queryFn: () => fetchAccounts(params),
  });
}

export function useAdminAccountsPageQuery(params: AccountListParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.accounts({ ...params, mode: "page" }),
    queryFn: () => fetchAccountsPage(params),
  });
}

export function useAdminAccountQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.account(id),
    queryFn: () => fetchAccount(id),
    enabled: Boolean(id),
  });
}

export function useAdminAccountByCodeQuery(code: string) {
  return useQuery({
    queryKey: queryKeys.admin.account(`code:${code}`),
    queryFn: () => fetchAccountByCode(code),
    enabled: Boolean(code),
  });
}

export function useAdminTransfersQuery(params: TransferListParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.transfers(params),
    queryFn: () => fetchTransfers(params),
  });
}

export function useAdminOperationsQuery(params: OperationListParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.paymentTransactions(JSON.stringify(params)),
    queryFn: () => fetchOperations(params),
  });
}

export function useAdminDailyReportQuery(date?: string) {
  return useQuery({
    queryKey: queryKeys.admin.dailyReport(date),
    queryFn: () => fetchDailyReport(date),
  });
}

export function useAdminMonthlyReportQuery(year: number, month: number) {
  return useQuery({
    queryKey: queryKeys.admin.monthlyReport(year, month),
    queryFn: () => fetchMonthlyReport(year, month),
  });
}

export function useAdminJournalReportQuery(params: JournalReportParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.journalReport(params),
    queryFn: () => fetchJournalReport(params),
  });
}

export function useAdminAccountLedgerQuery(params: AccountLedgerParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.accountLedger(params),
    queryFn: () => fetchAccountLedger(params),
    enabled: enabled && Boolean(params.accountId),
  });
}

export function useAdminFinancialSummaryQuery(params: DateRangeParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.financialSummary(params),
    queryFn: () => fetchFinancialSummary(params),
  });
}

export function useAdminIncomeStatementQuery(params: DateRangeParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.incomeStatement(params),
    queryFn: () => fetchIncomeStatement(params),
  });
}

export function useAdminBalanceSheetQuery(asOf?: string) {
  return useQuery({
    queryKey: queryKeys.admin.balanceSheet(asOf),
    queryFn: () => fetchBalanceSheet(asOf),
  });
}

export function useAdminAccountBalancesQuery(currencyCode?: CurrencyCode) {
  return useQuery({
    queryKey: queryKeys.admin.accountBalances(currencyCode),
    queryFn: () => fetchAccountBalances(currencyCode),
  });
}

export function useAdminCashBalancesQuery() {
  return useQuery({
    queryKey: queryKeys.admin.cashBalances(),
    queryFn: fetchCashBalances,
  });
}

export function useAdminInventoryBalancesQuery() {
  return useQuery({
    queryKey: queryKeys.admin.inventoryBalances(),
    queryFn: fetchInventoryBalances,
  });
}

export function useAdminCurrenciesQuery() {
  return useQuery({
    queryKey: [...queryKeys.admin.all, "currencies"],
    queryFn: fetchCurrencies,
  });
}

function useInvalidateAdminProducts() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: [...queryKeys.admin.all, "products"],
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.admin.productCategories(),
    });
  };
}

export function useCreateAdminProductMutation() {
  const invalidate = useInvalidateAdminProducts();
  return useMutation({
    mutationFn: (input: SaveProductInput) => createProduct(input),
    onSuccess: invalidate,
  });
}

export function useUpdateAdminProductMutation() {
  const invalidate = useInvalidateAdminProducts();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<SaveProductInput>;
    }) => updateProduct(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteAdminProductMutation() {
  const invalidate = useInvalidateAdminProducts();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: invalidate,
  });
}

export function useCreateAdminInventoryTransferMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveInventoryTransferInput) => createInventoryTransfer(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.admin.all, "products"],
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.inventoryBalances(),
      });
    },
  });
}

export function useCreateAdminProductCategoryMutation() {
  const invalidate = useInvalidateAdminProducts();
  return useMutation({
    mutationFn: (input: SaveProductCategoryInput) =>
      createProductCategory(input),
    onSuccess: invalidate,
  });
}

export function useDeleteAdminProductCategoryMutation() {
  const invalidate = useInvalidateAdminProducts();
  return useMutation({
    mutationFn: (id: string) => deleteProductCategory(id),
    onSuccess: invalidate,
  });
}

export function useDeleteAdminInventoryLocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInventoryLocation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.inventoryLocations(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.inventoryBalances(),
      });
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.admin.all, "products"],
      });
    },
  });
}

export function useCreateAdminSaleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveSaleInput) => createSale(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.admin.all, "sales"],
      });
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.admin.all, "products"],
      });
    },
  });
}

function useInvalidateAdminSales() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: [...queryKeys.admin.all, "sales"],
    });
    void queryClient.invalidateQueries({
      queryKey: [...queryKeys.admin.all, "products"],
    });
    void queryClient.invalidateQueries({
      queryKey: [...queryKeys.admin.all, "accounts"],
    });
  };
}

export function useUpdateAdminSaleMutation() {
  const invalidate = useInvalidateAdminSales();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SaveSaleInput }) =>
      updateSale(id, input),
    onSuccess: invalidate,
  });
}

export function useCancelAdminSaleMutation() {
  const invalidate = useInvalidateAdminSales();
  return useMutation({
    mutationFn: (id: string) => cancelSale(id),
    onSuccess: invalidate,
  });
}

export function useReceiveAdminSalePaymentMutation() {
  const invalidate = useInvalidateAdminSales();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SalePaymentInput }) =>
      receiveSalePayment(id, input),
    onSuccess: invalidate,
  });
}

export function useReturnAdminSaleProductsMutation() {
  const invalidate = useInvalidateAdminSales();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SaleReturnInput }) =>
      returnSaleProducts(id, input),
    onSuccess: invalidate,
  });
}

export function useCreateAdminPurchaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SavePurchaseInput) => createPurchase(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.admin.all, "purchases"],
      });
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.admin.all, "products"],
      });
    },
  });
}

function useInvalidateAdminPurchases() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: [...queryKeys.admin.all, "purchases"],
    });
    void queryClient.invalidateQueries({
      queryKey: [...queryKeys.admin.all, "products"],
    });
    void queryClient.invalidateQueries({
      queryKey: [...queryKeys.admin.all, "accounts"],
    });
  };
}

export function useUpdateAdminPurchaseMutation() {
  const invalidate = useInvalidateAdminPurchases();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SavePurchaseInput }) =>
      updatePurchase(id, input),
    onSuccess: invalidate,
  });
}

export function useCancelAdminPurchaseMutation() {
  const invalidate = useInvalidateAdminPurchases();
  return useMutation({
    mutationFn: (id: string) => cancelPurchase(id),
    onSuccess: invalidate,
  });
}

export function usePayAdminPurchaseMutation() {
  const invalidate = useInvalidateAdminPurchases();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PurchasePaymentInput }) =>
      payPurchaseBill(id, input),
    onSuccess: invalidate,
  });
}

export function useReturnAdminPurchaseProductsMutation() {
  const invalidate = useInvalidateAdminPurchases();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PurchaseReturnInput }) =>
      returnPurchaseProducts(id, input),
    onSuccess: invalidate,
  });
}

function useInvalidateAdminPartners() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: [...queryKeys.admin.all, "partners"],
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.admin.saleCustomers(),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.admin.purchaseVendors(),
    });
  };
}

export function useCreateAdminPartnerMutation() {
  const invalidate = useInvalidateAdminPartners();
  return useMutation({
    mutationFn: (input: SavePartnerInput) => createPartner(input),
    onSuccess: invalidate,
  });
}

export function useUpdateAdminPartnerMutation() {
  const invalidate = useInvalidateAdminPartners();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdatePartnerInput;
    }) => updatePartner(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteAdminPartnerMutation() {
  const invalidate = useInvalidateAdminPartners();
  return useMutation({
    mutationFn: (id: string) => deletePartner(id),
    onSuccess: invalidate,
  });
}

export function useCreateAdminPartnerLedgerAccountMutation() {
  const invalidate = useInvalidateAdminPartners();
  return useMutation({
    mutationFn: ({
      partnerId,
      input,
    }: {
      partnerId: string;
      input: SavePartnerLedgerAccountInput;
    }) => createPartnerLedgerAccount(partnerId, input),
    onSuccess: invalidate,
  });
}

function useInvalidateAdminAccounts() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: [...queryKeys.admin.all, "accounts"],
    });
    void queryClient.invalidateQueries({
      queryKey: [...queryKeys.admin.all, "sale-accounts"],
    });
  };
}

export function useCreateAdminAccountMutation() {
  const invalidate = useInvalidateAdminAccounts();
  return useMutation({
    mutationFn: (input: SaveAccountInput) => createAccount(input),
    onSuccess: invalidate,
  });
}

export function useUpdateAdminAccountMutation() {
  const invalidate = useInvalidateAdminAccounts();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<SaveAccountInput>;
    }) => updateAccount(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteAdminAccountMutation() {
  const invalidate = useInvalidateAdminAccounts();
  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: invalidate,
  });
}

export function useRecordAdminExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordExpenseInput) => recordExpense(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.all,
      });
    },
  });
}

export function useRecordAdminFundingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordFundingInput) => recordFunding(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all }),
  });
}

export function useCreateAdminTransferMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveTransferInput) => createTransfer(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.admin.all, "transfers"],
      });
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.admin.all, "accounts"],
      });
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.admin.all, "cash-balances"],
      });
    },
  });
}

export function useUpdateAdminProductCategoryMutation() {
  const invalidate = useInvalidateAdminProducts();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: SaveProductCategoryInput;
    }) => updateProductCategory(id, input),
    onSuccess: invalidate,
  });
}




export function useAdminUsersQuery(status: "active" | "disabled" | "all") {
  return useQuery({
    queryKey: queryKeys.admin.users(status),
    queryFn: () => adminApi.getUsers(status),
  });
}

export function useCreateAdminUserMutation() {
  const invalidate = useInvalidateAdminUsers();
  return useMutation({
    mutationFn: adminApi.createUser,
    onSuccess: invalidate,
  });
}

export function useUpdateAdminUserStatusMutation() {
  const queryClient = useQueryClient();
  const invalidateUsers = useInvalidateAdminUsers();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: Parameters<typeof adminApi.updateUserStatus>[1];
    }) => adminApi.updateUserStatus(id, status),
    onSuccess: (_data, variables) => {
      invalidateUsers();
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.user(variables.id),
      });
    },
  });
}

export function useUpdateAdminUserEmailVerificationMutation() {
  const queryClient = useQueryClient();
  const invalidateUsers = useInvalidateAdminUsers();
  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string | number;
      action: Parameters<typeof adminApi.updateUserEmailVerification>[1];
    }) => adminApi.updateUserEmailVerification(id, action),
    onSuccess: (_data, variables) => {
      invalidateUsers();
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.user(variables.id),
      });
    },
  });
}

export function useDeleteAdminUserMutation() {
  const queryClient = useQueryClient();
  const invalidateUsers = useInvalidateAdminUsers();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: (_data, id) => {
      invalidateUsers();
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.user(id),
      });
    },
  });
}

export function useAdminUserQuery(userId: string | number) {
  const normalizedUserId = String(userId);
  return useQuery({
    queryKey: queryKeys.admin.user(normalizedUserId),
    queryFn: () => adminApi.getUser(normalizedUserId),
    enabled: normalizedUserId.length > 0 && normalizedUserId !== "NaN",
  });
}

export function useAdminUserReportCountQuery(userId: number) {
  return useQuery({
    queryKey: queryKeys.admin.userReportCount(userId),
    queryFn: () => adminApi.getUserReportCount(userId),
    enabled: userId > 0,
  });
}


function useInvalidateAdminUsers() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: [...queryKeys.admin.all, "users"],
    });
}

import { apiRequest } from "@/lib/api";
import type { AccountCategory, AccountRow, AccountType, CurrencyCode } from "@/services/accounts.service";
import type { PartnerRow } from "@/services/partners.service";
import type { ProductPagination } from "@/services/products.service";

type PaginatedEnvelope<TData> = {
  data?: TData;
  pagination?: ProductPagination;
};

export type ReportTotal = {
  currencyCode: CurrencyCode;
  _sum?: {
    debit?: number | string | null;
    credit?: number | string | null;
    baseDebit?: number | string | null;
    baseCredit?: number | string | null;
  };
};

export type JournalStatus = "draft" | "posted" | "reversed" | "voided";
export type JournalSourceType =
  | "manual"
  | "sale"
  | "purchase"
  | "payment"
  | "money_transfer"
  | "inventory_adjustment"
  | "opening_balance";

type UserRef = {
  id: string;
  fullName?: string | null;
  username?: string | null;
};

export type JournalLineRow = {
  id: string;
  lineNo: number;
  currencyCode: CurrencyCode;
  debit?: number | string;
  credit?: number | string;
  baseDebit?: number | string;
  baseCredit?: number | string;
  memo?: string | null;
  runningBalance?: number | string;
  account?: Pick<AccountRow, "id" | "code" | "name" | "type" | "category" | "normalBalance"> | null;
  partner?: Pick<PartnerRow, "id" | "code" | "name" | "type"> | null;
  journalEntry?: JournalEntryRow;
};

export type JournalEntryRow = {
  id: string;
  number: string;
  entryDate: string;
  description?: string | null;
  status: JournalStatus;
  sourceType: JournalSourceType;
  sourceId?: string | null;
  postedAt?: string | null;
  createdBy?: UserRef | null;
  postedBy?: UserRef | null;
  movements?: Array<{
    id: string;
    number: string;
    type: "receipt" | "issue" | "transfer" | "adjustment" | "return_in" | "return_out";
    reference?: string | null;
  }>;
  lines?: JournalLineRow[];
};

export type JournalReportParams = {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  status?: JournalStatus;
  sourceType?: JournalSourceType;
  accountId?: string;
  partnerId?: string;
  currencyCode?: CurrencyCode;
  number?: string;
};

export type AccountLedgerParams = {
  page?: number;
  limit?: number;
  accountId: string;
  from?: string;
  to?: string;
};

export type DateRangeParams = {
  from?: string;
  to?: string;
};

export type JournalReportResult = {
  items: JournalEntryRow[];
  pagination: ProductPagination | null;
  summary: { currencyTotals: Array<{ currencyCode: CurrencyCode; debit: number | string; credit: number | string }> };
};

export type AccountLedgerResult = {
  items: JournalLineRow[];
  account: Pick<AccountRow, "id" | "code" | "name" | "type" | "category" | "normalBalance" | "currencyCode"> | null;
  summary: {
    openingBalance: number | string;
    totalDebit: number | string;
    totalCredit: number | string;
    closingBalance: number | string;
    currencyTotals: Array<{
      currencyCode: CurrencyCode;
      debit: number | string;
      credit: number | string;
      openingBalance?: number | string;
      closingBalance?: number | string;
    }>;
  };
  pagination: ProductPagination | null;
};

export type PartnerBalanceRow = {
  partner?: Pick<PartnerRow, "id" | "code" | "name" | "type"> | null;
  currencyCode: CurrencyCode;
  debitTotal: number | string;
  creditTotal: number | string;
  balance: number | string;
};

export type FinancialSummary = {
  period: { from?: string | null; to?: string | null };
  profitLoss: {
    revenue: number | string;
    expenses: number | string;
    net: number | string;
    status: "profit" | "loss";
  };
  receivables: {
    total: number | string;
    rows: PartnerBalanceRow[];
  };
  payables: {
    total: number | string;
    rows: PartnerBalanceRow[];
  };
};

export type StatementAccountRow = {
  account: Pick<AccountRow, "id" | "code" | "name" | "type" | "category" | "normalBalance">;
  debit: number | string;
  credit: number | string;
  balance: number | string;
  currencyCode?: CurrencyCode;
};

export type IncomeStatement = {
  period: { from?: string | null; to?: string | null };
  revenue: StatementAccountRow[];
  expenses: StatementAccountRow[];
  totals: {
    revenue: number | string;
    expenses: number | string;
    net: number | string;
    status: "profit" | "loss";
  };
  nativeTotals: Array<{
    currencyCode: CurrencyCode;
    revenue: number | string;
    expenses: number | string;
    net: number | string;
  }>;
};

export type BalanceSheet = {
  asOf: string;
  assets: StatementAccountRow[];
  liabilities: StatementAccountRow[];
  equity: {
    accounts: StatementAccountRow[];
    currentProfitLoss: number | string;
    total: number | string;
  };
  totals: {
    assets: number | string;
    liabilities: number | string;
    equity: number | string;
    liabilitiesAndEquity: number | string;
    difference: number | string;
    balanced: boolean;
  };
  nativeTotals: Array<{
    currencyCode: CurrencyCode;
    assets: number | string;
    liabilities: number | string;
    equity: number | string;
    crossCurrencyPosition: number | string;
    liabilitiesAndEquity: number | string;
    difference: number | string;
    balanced: boolean;
  }>;
};

export type DailyReport = {
  date: string;
  summary: {
    journalCount: number;
    transfersCount: number;
    totals: ReportTotal[];
  };
  journals: Array<{
    id: string;
    number: string;
    entryDate: string;
    description?: string | null;
    sourceType?: string | null;
    lines?: unknown[];
  }>;
};

export type MonthlyReport = {
  period: { year: number; month: number; start: string; end: string };
  summary: {
    journalCount: number;
    transferCount: number;
    salesCount: number;
    purchaseCount: number;
    totals: ReportTotal[];
  };
};

export type BalanceRow = {
  id?: string;
  currencyCode: CurrencyCode;
  debitTotal?: number | string;
  creditTotal?: number | string;
  balance?: number | string;
  account?: { id: string; code: string; name: string; type: AccountType; category?: AccountCategory };
  product?: { id: string; sku: string; name: string; reorderLevel?: number | string };
  location?: { id: string; code: string; name: string; type?: string };
  quantityOnHand?: number | string;
  averageCost?: number | string;
};

function queryString(params: Record<string, unknown>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const value = query.toString();
  return value ? `?${value}` : "";
}

export async function fetchDailyReport(date?: string): Promise<DailyReport> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return apiRequest<DailyReport>(`/api/reports/daily${query}`, { method: "GET" });
}

export async function fetchMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
  return apiRequest<MonthlyReport>(`/api/reports/monthly?year=${year}&month=${month}`, {
    method: "GET",
  });
}

export async function fetchJournalReport(
  params: JournalReportParams = {},
): Promise<JournalReportResult> {
  const res = await apiRequest<PaginatedEnvelope<JournalEntryRow[]> & Pick<JournalReportResult, "summary">>(
    `/api/reports/journal${queryString({ page: 1, limit: 10, ...params })}`,
    { method: "GET" },
  );
  return {
    items: Array.isArray(res.data) ? res.data : [],
    pagination: res.pagination ?? null,
    summary: res.summary ?? { currencyTotals: [] },
  };
}

export async function fetchAccountLedger(
  params: AccountLedgerParams,
): Promise<AccountLedgerResult> {
  const res = await apiRequest<
    PaginatedEnvelope<JournalLineRow[]> & Pick<AccountLedgerResult, "account" | "summary">
  >(`/api/reports/account-ledger${queryString({ page: 1, limit: 10, ...params })}`, {
    method: "GET",
  });
  return {
    items: Array.isArray(res.data) ? res.data : [],
    account: res.account ?? null,
    summary: res.summary ?? {
      openingBalance: 0,
      totalDebit: 0,
      totalCredit: 0,
      closingBalance: 0,
      currencyTotals: [],
    },
    pagination: res.pagination ?? null,
  };
}

export async function fetchFinancialSummary(
  params: DateRangeParams = {},
): Promise<FinancialSummary> {
  return apiRequest<FinancialSummary>(
    `/api/reports/financial-summary${queryString(params)}`,
    { method: "GET" },
  );
}

export async function fetchIncomeStatement(
  params: DateRangeParams = {},
): Promise<IncomeStatement> {
  return apiRequest<IncomeStatement>(
    `/api/reports/income-statement${queryString(params)}`,
    { method: "GET" },
  );
}

export async function fetchBalanceSheet(asOf?: string): Promise<BalanceSheet> {
  return apiRequest<BalanceSheet>(
    `/api/reports/balance-sheet${queryString({ asOf })}`,
    { method: "GET" },
  );
}

export async function fetchAccountBalances(currencyCode?: CurrencyCode): Promise<BalanceRow[]> {
  const query = currencyCode ? `?page=1&limit=100&currencyCode=${currencyCode}` : "?page=1&limit=100";
  const res = await apiRequest<PaginatedEnvelope<BalanceRow[]>>(
    `/api/reports/account-balances${query}`,
    { method: "GET" },
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchCashBalances(): Promise<BalanceRow[]> {
  const res = await apiRequest<{ balances?: BalanceRow[] }>("/api/reports/cash-balances", {
    method: "GET",
  });
  return Array.isArray(res.balances) ? res.balances : [];
}

export async function fetchInventoryBalances(): Promise<BalanceRow[]> {
  const res = await apiRequest<PaginatedEnvelope<BalanceRow[]>>(
    "/api/reports/inventory-balances?page=1&limit=100",
    { method: "GET" },
  );
  return Array.isArray(res.data) ? res.data : [];
}

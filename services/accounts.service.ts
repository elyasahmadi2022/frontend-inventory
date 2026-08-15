import { ApiError, apiRequest } from "@/lib/api";
import type { ProductPagination } from "@/services/products.service";

type ApiEnvelope<TData> = {
  account?: TData;
  payment?: TData;
  data?: TData;
  pagination?: ProductPagination;
  journalEntry?: TData;
};

export type AccountCategory = "asset" | "liability" | "equity" | "revenue" | "expense";
export type NormalBalance = "debit" | "credit";
export type CurrencyCode = "AFN" | "USD" | "PKR";

export type AccountType =
  | "cash"
  | "bank"
  | "sarafi"
  | "daskhil"
  | "accounts_receivable"
  | "accounts_payable"
  | "inventory"
  | "cost_of_goods_sold"
  | "sales_revenue"
  | "purchase"
  | "expense"
  | "equity"
  | "liability"
  | "exchange_gain"
  | "exchange_loss"
  | "other";

export type AccountRow = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  category: AccountCategory;
  normalBalance: NormalBalance;
  currencyCode?: string | null;
  parentId?: string | null;
  parent?: Pick<AccountRow, "id" | "code" | "name"> | null;
  isControlAccount?: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  balances?: Array<{
    currencyCode: CurrencyCode;
    debitTotal?: number | string;
    creditTotal?: number | string;
    balance?: number | string;
  }>;
};

export type AccountListParams = {
  page?: number;
  limit?: number;
  type?: AccountType;
  category?: AccountCategory;
  currencyCode?: CurrencyCode;
  isActive?: boolean;
};

export type AccountListResult = {
  items: AccountRow[];
  pagination: ProductPagination | null;
};

export type SaveAccountInput = {
  code?: string;
  name: string;
  category: AccountCategory;
  type: AccountType;
  normalBalance: NormalBalance;
  currencyCode: CurrencyCode;
  parentId?: string;
  isControlAccount?: boolean;
  isActive?: boolean;
};

export type RecordExpenseInput = {
  expenseDate: string;
  description: string;
  expenseAccountId: string;
  paymentAccountId: string;
  currencyCode: CurrencyCode;
  amount: number;
  exchangeRateToBase?: number;
  notes?: string;
};

export type RecordFundingInput = {
  fundingDate: string;
  description: string;
  assetAccountId: string;
  equityAccountId: string;
  currencyCode: CurrencyCode;
  amount: number;
  isOpeningBalance: boolean;
  notes?: string;
};

export type FundingJournalRow = { id: string; number: string; description: string; entryDate: string };

export type ExpensePaymentRow = {
  id: string;
  number: string;
  amount: number | string;
  currencyCode: CurrencyCode;
  paymentDate: string;
  notes?: string | null;
  fromAccount?: Pick<AccountRow, "id" | "code" | "name" | "type"> | null;
  toAccount?: Pick<AccountRow, "id" | "code" | "name" | "type"> | null;
  journalEntry?: {
    id: string;
    number: string;
    description: string;
    entryDate: string;
  } | null;
};

function cleanOptional(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

function queryString(params: AccountListParams) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.type) query.set("type", params.type);
  if (params.category) query.set("category", params.category);
  if (params.currencyCode) query.set("currencyCode", params.currencyCode);
  if (typeof params.isActive === "boolean") {
    query.set("isActive", String(params.isActive));
  }
  const value = query.toString();
  return value ? `?${value}` : "";
}

export async function fetchAccounts(
  params: AccountListParams = {},
): Promise<AccountRow[]> {
  const result = await fetchAccountsPage(params);
  return result.items;
}

export async function fetchAccountsPage(
  params: AccountListParams = {},
): Promise<AccountListResult> {
  const res = await apiRequest<ApiEnvelope<AccountRow[]>>(
    `/api/accounts${queryString({ page: 1, limit: 100, ...params })}`,
    { method: "GET" },
  );
  return {
    items: Array.isArray(res.data) ? res.data : [],
    pagination: res.pagination ?? null,
  };
}

export async function fetchAccount(id: string): Promise<AccountRow> {
  const res = await apiRequest<ApiEnvelope<AccountRow>>(`/api/accounts/${id}`, {
    method: "GET",
  });
  if (!res.account) throw new ApiError("Invalid account response.", { status: 500 });
  return res.account;
}

export async function fetchAccountByCode(code: string): Promise<AccountRow> {
  const res = await apiRequest<ApiEnvelope<AccountRow>>(
    `/api/accounts/code/${encodeURIComponent(code)}`,
    { method: "GET" },
  );
  if (!res.account) throw new ApiError("Invalid account response.", { status: 500 });
  return res.account;
}

export async function createAccount(input: SaveAccountInput): Promise<AccountRow> {
  const res = await apiRequest<ApiEnvelope<AccountRow>>("/api/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      code: cleanOptional(input.code),
      name: input.name.trim(),
      currencyCode: cleanOptional(input.currencyCode),
      parentId: cleanOptional(input.parentId),
    }),
  });
  if (!res.account) throw new ApiError("Invalid account response.", { status: 500 });
  return res.account;
}

export async function updateAccount(
  id: string,
  input: Partial<SaveAccountInput>,
): Promise<AccountRow> {
  const res = await apiRequest<ApiEnvelope<AccountRow>>(`/api/accounts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      code: "code" in input ? cleanOptional(input.code) : undefined,
      name: input.name ? input.name.trim() : undefined,
      currencyCode:
        "currencyCode" in input ? cleanOptional(input.currencyCode) : undefined,
      parentId: "parentId" in input ? cleanOptional(input.parentId) : undefined,
    }),
  });
  if (!res.account) throw new ApiError("Invalid account response.", { status: 500 });
  return res.account;
}

export async function deleteAccount(id: string): Promise<AccountRow> {
  const res = await apiRequest<ApiEnvelope<AccountRow>>(`/api/accounts/${id}`, {
    method: "DELETE",
  });
  if (!res.account) throw new ApiError("Invalid account response.", { status: 500 });
  return res.account;
}

export async function recordExpense(
  input: RecordExpenseInput,
): Promise<ExpensePaymentRow> {
  const res = await apiRequest<ApiEnvelope<ExpensePaymentRow>>("/api/accounts/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      description: input.description.trim(),
      notes: cleanOptional(input.notes),
    }),
  });
  if (!res.payment) throw new ApiError("Invalid expense response.", { status: 500 });
  return res.payment;
}

export async function recordFunding(input: RecordFundingInput): Promise<FundingJournalRow> {
  const res = await apiRequest<ApiEnvelope<FundingJournalRow>>("/api/accounts/funding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, description: input.description.trim(), notes: cleanOptional(input.notes) }),
  });
  if (!res.journalEntry) throw new ApiError("Invalid funding response.", { status: 500 });
  return res.journalEntry;
}

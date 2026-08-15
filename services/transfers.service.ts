import { ApiError, apiRequest } from "@/lib/api";
import type { AccountRow, CurrencyCode } from "@/services/accounts.service";
import type { ProductPagination } from "@/services/products.service";

type ApiEnvelope<TData> = {
  data?: TData;
  pagination?: ProductPagination;
  transfer?: TData;
};

export type TransferStatus = "draft" | "posted" | "cancelled";

export type TransferRow = {
  id: string;
  number: string;
  status: TransferStatus;
  transferDate: string;
  fromAccountId: string;
  toAccountId: string;
  currencyCode: CurrencyCode;
  destinationCurrencyCode?: CurrencyCode | null;
  exchangeRateToBase: number | string;
  amount: number | string;
  destinationAmount?: number | string | null;
  conversionRate?: number | string | null;
  feeAmount: number | string;
  reference?: string | null;
  notes?: string | null;
  fromAccount?: Pick<AccountRow, "id" | "code" | "name" | "type"> | null;
  toAccount?: Pick<AccountRow, "id" | "code" | "name" | "type"> | null;
};

export type TransferListParams = {
  page?: number;
  limit?: number;
  status?: TransferStatus | "all";
  from?: string;
  to?: string;
};

export type TransferListResult = {
  items: TransferRow[];
  pagination: ProductPagination | null;
};

export type SaveTransferInput = {
  transferDate: string;
  fromAccountId: string;
  toAccountId: string;
  currencyCode: CurrencyCode;
  destinationCurrencyCode?: CurrencyCode;
  destinationAmount?: number;
  conversionRate?: number;
  exchangeRateToBase: number;
  amount: number;
  feeAmount: number;
  notes?: string;
};

function cleanOptional(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

function queryString(params: TransferListParams) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  const value = query.toString();
  return value ? `?${value}` : "";
}

export async function fetchTransfers(
  params: TransferListParams = {},
): Promise<TransferListResult> {
  const res = await apiRequest<ApiEnvelope<TransferRow[]>>(
    `/api/transfers${queryString({ page: 1, limit: 100, ...params })}`,
    { method: "GET" },
  );
  return {
    items: Array.isArray(res.data) ? res.data : [],
    pagination: res.pagination ?? null,
  };
}

export async function createTransfer(input: SaveTransferInput): Promise<TransferRow> {
  const res = await apiRequest<ApiEnvelope<TransferRow>>("/api/transfers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      notes: cleanOptional(input.notes),
    }),
  });
  if (!res.transfer) throw new ApiError("Invalid transfer response.", { status: 500 });
  return res.transfer;
}

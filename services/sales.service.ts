import { ApiError, apiRequest } from "@/lib/api";
import type { AccountRow } from "@/services/accounts.service";
import type { PartnerRow } from "@/services/partners.service";
import type {
  InventoryLocationRow,
  ProductPagination,
  ProductRow,
} from "@/services/products.service";

type ApiEnvelope<TData> = {
  data?: TData;
  pagination?: ProductPagination;
  sale?: TData;
};

export type SaleStatus =
  | "draft"
  | "posted"
  | "partially_paid"
  | "paid"
  | "cancelled";
export type CurrencyCode = "AFN" | "USD" | "PKR";

export type SaleLineRow = {
  id: string;
  lineNo: number;
  productId: string;
  locationId: string;
  description?: string | null;
  quantity: number | string;
  unitPrice: number | string;
  discount: number | string;
  lineTotal: number | string;
  costTotal: number | string;
  product?:
    | (Pick<ProductRow, "id" | "sku" | "name"> & {
        baseUnit?: ProductRow["baseUnit"];
      })
    | null;
  location?: Pick<InventoryLocationRow, "id" | "code" | "name"> | null;
};

export type SaleRow = {
  id: string;
  number: string;
  customerId: string;
  invoiceDate: string;
  dueDate?: string | null;
  isImportant: boolean;
  status: SaleStatus;
  currencyCode: CurrencyCode;
  subtotal: number | string;
  discountTotal: number | string;
  taxTotal: number | string;
  total: number | string;
  paidTotal: number | string;
  notes?: string | null;
  customer?: Pick<
    PartnerRow,
    "id" | "code" | "name" | "type" | "phone" | "address"
  > | null;
  revenueAccount?: Pick<AccountRow, "id" | "code" | "name" | "type"> | null;
  inventoryAccount?: Pick<AccountRow, "id" | "code" | "name" | "type"> | null;
  cogsAccount?: Pick<AccountRow, "id" | "code" | "name" | "type"> | null;
  lines?: SaleLineRow[];
  createdBy?: {
    id: string;
    code?: string | null;
    fullName?: string | null;
    username: string;
  } | null;
};

export type SaleListParams = {
  page?: number;
  limit?: number;
  status?: SaleStatus | "all";
  customerId?: string;
  from?: string;
  to?: string;
};

export type SaleListResult = {
  items: SaleRow[];
  pagination: ProductPagination | null;
};

export type SaveSaleLineInput = {
  productId: string;
  locationId: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  discount: number;
};

export type SaveSaleInput = {
  customerId?: string;
  invoiceDate: string;
  dueDate?: string;
  isImportant: boolean;
  currencyCode: CurrencyCode;
  exchangeRateToBase?: number;
  productCurrencyCode?: CurrencyCode;
  productExchangeRate?: number;
  revenueAccountId?: string;
  inventoryAccountId?: string;
  cogsAccountId?: string;
  taxTotal: number;
  receiptAccountId?: string;
  receivedAmount: number;
  notes?: string;
  lines: SaveSaleLineInput[];
};

function cleanOptional(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

function queryString(params: SaleListParams) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status && params.status !== "all")
    query.set("status", params.status);
  if (params.customerId) query.set("customerId", params.customerId);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  const value = query.toString();
  return value ? `?${value}` : "";
}

export async function fetchSales(
  params: SaleListParams = {},
): Promise<SaleListResult> {
  const res = await apiRequest<ApiEnvelope<SaleRow[]>>(
    `/api/sales${queryString({ page: 1, limit: 100, ...params })}`,
    { method: "GET" },
  );
  return {
    items: Array.isArray(res.data) ? res.data : [],
    pagination: res.pagination ?? null,
  };
}

export async function fetchSaleByNumber(number: string): Promise<SaleRow> {
  const res = await apiRequest<ApiEnvelope<SaleRow>>(
    `/api/sales/number/${encodeURIComponent(number)}`,
    { method: "GET" },
  );
  if (!res.sale) throw new ApiError("Invalid sale response.", { status: 500 });
  return res.sale;
}

export async function fetchSale(identifier: string): Promise<SaleRow> {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      identifier,
    );
  if (!isUuid) return fetchSaleByNumber(identifier);

  const res = await apiRequest<ApiEnvelope<SaleRow>>(
    `/api/sales/${encodeURIComponent(identifier)}`,
    { method: "GET" },
  );
  if (!res.sale) throw new ApiError("Invalid sale response.", { status: 500 });
  return res.sale;
}

export async function createSale(input: SaveSaleInput): Promise<SaleRow> {
  const res = await apiRequest<ApiEnvelope<SaleRow>>("/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      customerId:
        input.customerId === "__walk_in__" ? undefined : input.customerId,
      exchangeRateToBase: input.exchangeRateToBase ?? 1,
      dueDate: cleanOptional(input.dueDate),
      revenueAccountId: cleanOptional(input.revenueAccountId),
      inventoryAccountId: cleanOptional(input.inventoryAccountId),
      cogsAccountId: cleanOptional(input.cogsAccountId),
      receiptAccountId: cleanOptional(input.receiptAccountId),
      notes: cleanOptional(input.notes),
      lines: input.lines.map((line) => ({
        ...line,
        description: cleanOptional(line.description),
      })),
    }),
  });
  if (!res.sale) throw new ApiError("Invalid sale response.", { status: 500 });
  return res.sale;
}

export type SalePaymentInput = {
  amount: number;
  receiptAccountId?: string;
  paymentDate?: string;
  notes?: string;
  paymentExchangeRate?: number;
};

export type SaleReturnLineInput = {
  lineId: string;
  quantity: number;
};

export type SaleReturnInput = {
  lines: SaleReturnLineInput[];
  refundAccountId?: string;
  notes?: string;
};

export async function updateSale(
  id: string,
  input: SaveSaleInput,
): Promise<SaleRow> {
  const res = await apiRequest<ApiEnvelope<SaleRow>>(
    `/api/sales/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        customerId:
          input.customerId === "__walk_in__" ? undefined : input.customerId,
        exchangeRateToBase: input.exchangeRateToBase ?? 1,
        dueDate: cleanOptional(input.dueDate),
        revenueAccountId: cleanOptional(input.revenueAccountId),
        inventoryAccountId: cleanOptional(input.inventoryAccountId),
        cogsAccountId: cleanOptional(input.cogsAccountId),
        receiptAccountId: cleanOptional(input.receiptAccountId),
        notes: cleanOptional(input.notes),
        lines: input.lines.map((line) => ({
          ...line,
          description: cleanOptional(line.description),
        })),
      }),
    },
  );
  if (!res.sale) throw new ApiError("Invalid sale response.", { status: 500 });
  return res.sale;
}

export async function cancelSale(id: string): Promise<SaleRow> {
  const res = await apiRequest<ApiEnvelope<SaleRow>>(
    `/api/sales/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );
  if (!res.sale) throw new ApiError("Invalid sale response.", { status: 500 });
  return res.sale;
}

export async function receiveSalePayment(
  id: string,
  input: SalePaymentInput,
): Promise<SaleRow> {
  const res = await apiRequest<ApiEnvelope<SaleRow>>(
    `/api/sales/${encodeURIComponent(id)}/payments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        receiptAccountId: cleanOptional(input.receiptAccountId),
        notes: cleanOptional(input.notes),
      }),
    },
  );
  if (!res.sale) throw new ApiError("Invalid sale response.", { status: 500 });
  return res.sale;
}

export async function returnSaleProducts(
  id: string,
  input: SaleReturnInput,
): Promise<SaleRow> {
  const res = await apiRequest<ApiEnvelope<SaleRow>>(
    `/api/sales/${encodeURIComponent(id)}/returns`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: input.lines,
        refundAccountId: cleanOptional(input.refundAccountId),
        notes: cleanOptional(input.notes),
      }),
    },
  );
  if (!res.sale) throw new ApiError("Invalid sale response.", { status: 500 });
  return res.sale;
}

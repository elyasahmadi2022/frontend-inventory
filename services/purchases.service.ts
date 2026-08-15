import { ApiError, apiRequest } from "@/lib/api";
import type { AccountRow } from "@/services/accounts.service";
import type { PartnerRow } from "@/services/partners.service";
import type {
  InventoryLocationRow,
  ProductPagination,
  ProductRow,
} from "@/services/products.service";
import type { CurrencyCode, SaleStatus } from "@/services/sales.service";

type ApiEnvelope<TData> = {
  data?: TData;
  pagination?: ProductPagination;
  purchase?: TData;
};

export type PurchaseStatus = SaleStatus;

export type PurchaseLineRow = {
  id: string;
  lineNo: number;
  productId: string;
  locationId: string;
  description?: string | null;
  quantity: number | string;
  unitCost: number | string;
  discount: number | string;
  lineTotal: number | string;
  product?:
    | (Pick<ProductRow, "id" | "sku" | "name"> & {
        baseUnit?: ProductRow["baseUnit"];
      })
    | null;
  location?: Pick<InventoryLocationRow, "id" | "code" | "name"> | null;
};

export type PurchaseRow = {
  id: string;
  number: string;
  vendorId: string;
  billDate: string;
  dueDate?: string | null;
  status: PurchaseStatus;
  currencyCode: CurrencyCode;
  subtotal: number | string;
  discountTotal: number | string;
  taxTotal: number | string;
  total: number | string;
  paidTotal: number | string;
  notes?: string | null;
  vendor?: Pick<
    PartnerRow,
    "id" | "code" | "name" | "type" | "phone" | "address"
  > | null;
  inventoryAccount?: Pick<AccountRow, "id" | "code" | "name" | "type"> | null;
  expenseAccount?: Pick<AccountRow, "id" | "code" | "name" | "type"> | null;
  lines?: PurchaseLineRow[];
};

export type PurchaseListParams = {
  page?: number;
  limit?: number;
  status?: PurchaseStatus | "all";
  vendorId?: string;
  from?: string;
  to?: string;
};

export type PurchaseListResult = {
  items: PurchaseRow[];
  pagination: ProductPagination | null;
};

export type SavePurchaseLineInput = {
  productId: string;
  locationId: string;
  description?: string;
  quantity: number;
  unitCost: number;
  discount: number;
};

export type SavePurchaseInput = {
  vendorId: string;
  billDate: string;
  dueDate?: string;
  currencyCode: CurrencyCode;
  exchangeRateToBase?: number;
  productExchangeRate?: number;
  inventoryAccountId?: string;
  expenseAccountId?: string;
  taxTotal: number;
  paymentAccountId?: string;
  paidAmount: number;
  notes?: string;
  lines: SavePurchaseLineInput[];
};

function cleanOptional(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

function queryString(params: PurchaseListParams) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status && params.status !== "all")
    query.set("status", params.status);
  if (params.vendorId) query.set("vendorId", params.vendorId);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  const value = query.toString();
  return value ? `?${value}` : "";
}

export async function fetchPurchases(
  params: PurchaseListParams = {},
): Promise<PurchaseListResult> {
  const res = await apiRequest<ApiEnvelope<PurchaseRow[]>>(
    `/api/purchases${queryString({ page: 1, limit: 100, ...params })}`,
    { method: "GET" },
  );
  return {
    items: Array.isArray(res.data) ? res.data : [],
    pagination: res.pagination ?? null,
  };
}

export async function fetchPurchaseByNumber(
  number: string,
): Promise<PurchaseRow> {
  const res = await apiRequest<ApiEnvelope<PurchaseRow>>(
    `/api/purchases/number/${encodeURIComponent(number)}`,
    { method: "GET" },
  );
  if (!res.purchase) {
    throw new ApiError("Invalid purchase response.", { status: 500 });
  }
  return res.purchase;
}

export async function fetchPurchase(identifier: string): Promise<PurchaseRow> {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      identifier,
    );
  if (!isUuid) return fetchPurchaseByNumber(identifier);

  const res = await apiRequest<ApiEnvelope<PurchaseRow>>(
    `/api/purchases/${encodeURIComponent(identifier)}`,
    { method: "GET" },
  );
  if (!res.purchase) {
    throw new ApiError("Invalid purchase response.", { status: 500 });
  }
  return res.purchase;
}

export async function createPurchase(
  input: SavePurchaseInput,
): Promise<PurchaseRow> {
  const res = await apiRequest<ApiEnvelope<PurchaseRow>>("/api/purchases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      exchangeRateToBase: input.exchangeRateToBase ?? 1,
      dueDate: cleanOptional(input.dueDate),
      inventoryAccountId: cleanOptional(input.inventoryAccountId),
      expenseAccountId: cleanOptional(input.expenseAccountId),
      paymentAccountId: cleanOptional(input.paymentAccountId),
      notes: cleanOptional(input.notes),
      lines: input.lines.map((line) => ({
        ...line,
        description: cleanOptional(line.description),
      })),
    }),
  });
  if (!res.purchase) {
    throw new ApiError("Invalid purchase response.", { status: 500 });
  }
  return res.purchase;
}

export type PurchasePaymentInput = {
  amount: number;
  paymentAccountId?: string;
  paymentDate?: string;
  notes?: string;
};

export type PurchaseReturnLineInput = {
  lineId: string;
  quantity: number;
};

export type PurchaseReturnInput = {
  lines: PurchaseReturnLineInput[];
  refundAccountId?: string;
  notes?: string;
};

export async function updatePurchase(
  id: string,
  input: SavePurchaseInput,
): Promise<PurchaseRow> {
  const res = await apiRequest<ApiEnvelope<PurchaseRow>>(
    `/api/purchases/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        exchangeRateToBase: input.exchangeRateToBase ?? 1,
        dueDate: cleanOptional(input.dueDate),
        inventoryAccountId: cleanOptional(input.inventoryAccountId),
        expenseAccountId: cleanOptional(input.expenseAccountId),
        paymentAccountId: cleanOptional(input.paymentAccountId),
        notes: cleanOptional(input.notes),
        lines: input.lines.map((line) => ({
          ...line,
          description: cleanOptional(line.description),
        })),
      }),
    },
  );
  if (!res.purchase) {
    throw new ApiError("Invalid purchase response.", { status: 500 });
  }
  return res.purchase;
}

export async function cancelPurchase(id: string): Promise<PurchaseRow> {
  const res = await apiRequest<ApiEnvelope<PurchaseRow>>(
    `/api/purchases/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  if (!res.purchase) {
    throw new ApiError("Invalid purchase response.", { status: 500 });
  }
  return res.purchase;
}

export async function payPurchaseBill(
  id: string,
  input: PurchasePaymentInput,
): Promise<PurchaseRow> {
  const res = await apiRequest<ApiEnvelope<PurchaseRow>>(
    `/api/purchases/${encodeURIComponent(id)}/payments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        paymentAccountId: cleanOptional(input.paymentAccountId),
        notes: cleanOptional(input.notes),
      }),
    },
  );
  if (!res.purchase) {
    throw new ApiError("Invalid purchase response.", { status: 500 });
  }
  return res.purchase;
}

export async function returnPurchaseProducts(
  id: string,
  input: PurchaseReturnInput,
): Promise<PurchaseRow> {
  const res = await apiRequest<ApiEnvelope<PurchaseRow>>(
    `/api/purchases/${encodeURIComponent(id)}/returns`,
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
  if (!res.purchase) {
    throw new ApiError("Invalid purchase response.", { status: 500 });
  }
  return res.purchase;
}

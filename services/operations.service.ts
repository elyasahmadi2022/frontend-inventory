import { apiRequest } from "@/lib/api";
import type { AccountRow, CurrencyCode } from "@/services/accounts.service";
import type { PartnerRow } from "@/services/partners.service";
import type { ProductPagination } from "@/services/products.service";

export type OperationKind = "customer_receipt" | "customer_refund" | "vendor_payment" | "vendor_refund" | "expense" | "internal_transfer";
export type OperationFilter = "all" | "payment" | "transfer";

export type OperationRow = {
  id: string;
  number: string;
  kind: OperationKind;
  direction: "receive" | "pay" | "transfer";
  date: string;
  currencyCode: CurrencyCode;
  amount: number | string;
  fromAccount?: Pick<AccountRow, "id" | "code" | "name"> | null;
  toAccount?: Pick<AccountRow, "id" | "code" | "name"> | null;
  partner?: Pick<PartnerRow, "id" | "code" | "name"> | null;
  documentNumber?: string | null;
  notes?: string | null;
};

export type OperationListParams = { page?: number; limit?: number; kind?: OperationFilter };
export type OperationListResult = { items: OperationRow[]; pagination: ProductPagination | null };

export async function fetchOperations(params: OperationListParams = {}): Promise<OperationListResult> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 25));
  if (params.kind && params.kind !== "all") query.set("kind", params.kind);
  const response = await apiRequest<{ data?: OperationRow[]; pagination?: ProductPagination }>(`/api/operations?${query}`);
  return { items: response.data ?? [], pagination: response.pagination ?? null };
}

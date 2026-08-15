import { ApiError, apiRequest } from "@/lib/api";
import type { AccountRow } from "@/services/accounts.service";
import type { ProductPagination } from "@/services/products.service";

type ApiEnvelope<TData> = {
  data?: TData;
  ledgerAccount?: TData;
  pagination?: ProductPagination;
  partner?: TData;
};

export type PartnerType = "customer" | "vendor" | "both" | "sarafi" | "staff";

export type PartnerLedgerAccount = {
  id: string;
  accountId: string;
  currencyCode: "AFN" | "USD" | "PKR";
  type: "receivable" | "payable" | "advance_received" | "advance_paid" | "deposit";
  isDefault?: boolean;
  account?: Pick<AccountRow, "id" | "code" | "name" | "type">;
};

export type PartnerRow = {
  id: string;
  code: string;
  name: string;
  type: PartnerType;
  phone?: string | null;
  address?: string | null;
  receivableAccountId?: string | null;
  payableAccountId?: string | null;
  receivableAccount?: Pick<AccountRow, "id" | "code" | "name"> | null;
  payableAccount?: Pick<AccountRow, "id" | "code" | "name"> | null;
  isActive: boolean;
  ledgerAccounts?: PartnerLedgerAccount[];
};

export type PartnerListParams = {
  page?: number;
  limit?: number;
  type?: PartnerType | "all";
  isActive?: boolean;
};

export type PartnerListResult = {
  items: PartnerRow[];
  pagination: ProductPagination | null;
};

export type SavePartnerInput = {
  code?: string;
  name: string;
  type: PartnerType;
  phone?: string;
  address?: string;
  receivableAccountId?: string;
  payableAccountId?: string;
  isActive?: boolean;
};

export type UpdatePartnerInput = Partial<SavePartnerInput>;

export type SavePartnerLedgerAccountInput = {
  accountId: string;
  currencyCode: "AFN" | "USD" | "PKR";
  type: PartnerLedgerAccount["type"];
  isDefault?: boolean;
};

function cleanOptional(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

function queryString(params: PartnerListParams) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.type && params.type !== "all") query.set("type", params.type);
  if (typeof params.isActive === "boolean") {
    query.set("isActive", String(params.isActive));
  }
  const value = query.toString();
  return value ? `?${value}` : "";
}

function partnerPayload(input: Partial<SavePartnerInput>) {
  return {
    ...input,
    code: "code" in input ? cleanOptional(input.code) : undefined,
    name: input.name ? input.name.trim() : undefined,
    phone: "phone" in input ? cleanOptional(input.phone) : undefined,
    address: "address" in input ? cleanOptional(input.address) : undefined,
    receivableAccountId:
      "receivableAccountId" in input
        ? cleanOptional(input.receivableAccountId)
        : undefined,
    payableAccountId:
      "payableAccountId" in input ? cleanOptional(input.payableAccountId) : undefined,
  };
}

function updatePartnerPayload(input: UpdatePartnerInput) {
  return partnerPayload(input);
}

export async function fetchPartners(
  params: PartnerListParams = {},
): Promise<PartnerListResult> {
  const res = await apiRequest<ApiEnvelope<PartnerRow[]>>(
    `/api/partners${queryString({ page: 1, limit: 100, ...params })}`,
    { method: "GET" },
  );
  return {
    items: Array.isArray(res.data) ? res.data : [],
    pagination: res.pagination ?? null,
  };
}

export async function createPartner(input: SavePartnerInput): Promise<PartnerRow> {
  const res = await apiRequest<ApiEnvelope<PartnerRow>>("/api/partners", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(partnerPayload(input)),
  });
  if (!res.partner) throw new ApiError("Invalid partner response.", { status: 500 });
  return res.partner;
}

export async function updatePartner(
  id: string,
  input: UpdatePartnerInput,
): Promise<PartnerRow> {
  const res = await apiRequest<ApiEnvelope<PartnerRow>>(`/api/partners/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatePartnerPayload(input)),
  });
  if (!res.partner) throw new ApiError("Invalid partner response.", { status: 500 });
  return res.partner;
}

export async function deletePartner(id: string): Promise<PartnerRow> {
  const res = await apiRequest<ApiEnvelope<PartnerRow>>(`/api/partners/${id}`, {
    method: "DELETE",
  });
  if (!res.partner) throw new ApiError("Invalid partner response.", { status: 500 });
  return res.partner;
}

export async function createPartnerLedgerAccount(
  partnerId: string,
  input: SavePartnerLedgerAccountInput,
): Promise<PartnerLedgerAccount> {
  const res = await apiRequest<ApiEnvelope<PartnerLedgerAccount>>(
    `/api/partners/${partnerId}/ledger-accounts`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!res.ledgerAccount) {
    throw new ApiError("Invalid ledger account response.", { status: 500 });
  }
  return res.ledgerAccount;
}

export async function fetchSaleCustomers(): Promise<PartnerRow[]> {
  const customer = await apiRequest<ApiEnvelope<PartnerRow[]>>(
    "/api/partners?page=1&limit=100&type=customer&isActive=true",
    { method: "GET" },
  );
  return Array.isArray(customer.data) ? customer.data : [];
}

export async function fetchPurchaseVendors(): Promise<PartnerRow[]> {
  const vendor = await apiRequest<ApiEnvelope<PartnerRow[]>>(
    "/api/partners?page=1&limit=100&type=vendor&isActive=true",
    { method: "GET" },
  );
  return Array.isArray(vendor.data) ? vendor.data : [];
}

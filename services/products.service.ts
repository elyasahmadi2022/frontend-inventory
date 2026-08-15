import { ApiError, apiRequest } from "@/lib/api";

type ApiEnvelope<TData> = {
  category?: TData;
  categories?: TData;
  data?: TData;
  location?: TData;
  locations?: TData;
  pagination?: ProductPagination;
  product?: TData;
  unit?: TData;
  units?: TData;
  movement?: TData;
};

export type ProductPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type UnitRow = {
  id: string;
  code: string;
  name: string;
};

export type ProductAvailableUnitRow = {
  id?: string;
  unitId?: string;
  unit?: UnitRow | null;
  code?: string;
  name?: string;
  conversionFactor?: number | string;
};

export type SaveUnitInput = {
  code: string;
  name: string;
};

export type ProductCategoryRow = {
  id: string;
  name: string;
  parentId?: string | null;
  parent?: ProductCategoryRow | null;
  children?: ProductCategoryRow[];
};

export type SaveProductCategoryInput = {
  name: string;
  parentId?: string;
};

export type InventoryLocationRow = {
  id: string;
  code: string;
  name: string;
  type?: "warehouse" | "store" | "shelf" | "in_transit" | "damaged";
  parentId?: string | null;
  isActive: boolean;
};

export type InventoryLocationType =
  | "warehouse"
  | "store"
  | "shelf"
  | "in_transit"
  | "damaged";

export type SaveInventoryLocationInput = {
  code?: string;
  name: string;
  type: InventoryLocationType;
  parentId?: string;
  isActive?: boolean;
};

export type ProductInventoryBalance = {
  /** Raw field returned by the product API. */
  quantity?: number | string;
  quantityOnHand?: number | string;
  reservedQuantity?: number | string;
  averageCost?: number | string;
  inventoryValue?: number | string;
  lastMovementDate?: string | null;
  location?: InventoryLocationRow | null;
};

function normalizeProduct(product: ProductRow): ProductRow {
  return {
    ...product,
    inventoryBalances: product.inventoryBalances?.map((balance) => ({
      ...balance,
      quantityOnHand: balance.quantityOnHand ?? balance.quantity ?? 0,
    })),
  };
}

export type ProductRow = {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  baseUnitId: string;
  preferredPurchaseCurrency: "AFN" | "USD" | "PKR";
  preferredSaleCurrency: "AFN" | "USD" | "PKR";
  standardCost: number | string;
  defaultSalePrice: number | string;
  reorderLevel: number | string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  category?: ProductCategoryRow | null;
  baseUnit?: UnitRow | null;
  availableUnits?: ProductAvailableUnitRow[];
  inventoryBalances?: ProductInventoryBalance[];
};

export type ProductListParams = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
};

export type ProductListResult = {
  items: ProductRow[];
  pagination: ProductPagination | null;
};

export type SaveProductInput = {
  sku?: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: string;
  baseUnitId: string;
  preferredPurchaseCurrency: "AFN" | "USD" | "PKR";
  preferredSaleCurrency: "AFN" | "USD" | "PKR";
  standardCost: number;
  defaultSalePrice: number;
  reorderLevel: number;
  isActive?: boolean;
};

export type SaveInventoryTransferInput = {
  movedAt?: string;
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  reference?: string;
  notes?: string;
};

export type InventoryMovementRow = {
  id: string;
  number: string;
  type: string;
  status: string;
  movedAt: string;
};

function cleanOptional(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

function productPayload(input: Partial<SaveProductInput>) {
  return {
    ...input,
    sku: "sku" in input ? cleanOptional(input.sku) : undefined,
    barcode: "barcode" in input ? cleanOptional(input.barcode) : undefined,
    description:
      "description" in input ? cleanOptional(input.description) : undefined,
    categoryId: "categoryId" in input ? cleanOptional(input.categoryId) : undefined,
    name: input.name ? input.name.trim() : undefined,
  };
}

function queryString(params: ProductListParams) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (typeof params.isActive === "boolean") {
    query.set("isActive", String(params.isActive));
  }
  const value = query.toString();
  return value ? `?${value}` : "";
}

export async function fetchProducts(
  params: ProductListParams = {},
): Promise<ProductListResult> {
  const res = await apiRequest<ApiEnvelope<ProductRow[]>>(
    `/api/products${queryString({ page: 1, limit: 100, ...params })}`,
    { method: "GET" },
  );
  return {
    items: Array.isArray(res.data) ? res.data.map(normalizeProduct) : [],
    pagination: res.pagination ?? null,
  };
}

export async function createProduct(input: SaveProductInput): Promise<ProductRow> {
  const res = await apiRequest<ApiEnvelope<ProductRow>>("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productPayload(input)),
  });
  if (!res.product) throw new ApiError("Invalid product response.", { status: 500 });
  return normalizeProduct(res.product);
}

export async function updateProduct(
  id: string,
  input: Partial<SaveProductInput>,
): Promise<ProductRow> {
  const res = await apiRequest<ApiEnvelope<ProductRow>>(`/api/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productPayload(input)),
  });
  if (!res.product) throw new ApiError("Invalid product response.", { status: 500 });
  return normalizeProduct(res.product);
}

export async function deleteProduct(id: string): Promise<ProductRow> {
  const res = await apiRequest<ApiEnvelope<ProductRow>>(`/api/products/${id}`, {
    method: "DELETE",
  });
  if (!res.product) throw new ApiError("Invalid product response.", { status: 500 });
  return res.product;
}

export async function fetchProductCategories(): Promise<ProductCategoryRow[]> {
  const res = await apiRequest<ApiEnvelope<ProductCategoryRow[]>>(
    "/api/products/categories",
    { method: "GET" },
  );
  return Array.isArray(res.categories) ? res.categories : [];
}

export async function createProductCategory(
  input: SaveProductCategoryInput,
): Promise<ProductCategoryRow> {
  const res = await apiRequest<ApiEnvelope<ProductCategoryRow>>(
    "/api/products/categories",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name.trim(),
        parentId: cleanOptional(input.parentId),
      }),
    },
  );
  if (!res.category) throw new ApiError("Invalid category response.", { status: 500 });
  return res.category;
}

export async function updateProductCategory(
  id: string,
  input: SaveProductCategoryInput,
): Promise<ProductCategoryRow> {
  const res = await apiRequest<ApiEnvelope<ProductCategoryRow>>(
    `/api/products/categories/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name.trim(),
        parentId: cleanOptional(input.parentId),
      }),
    },
  );
  if (!res.category) throw new ApiError("Invalid category response.", { status: 500 });
  return res.category;
}

export async function deleteProductCategory(id: string): Promise<ProductCategoryRow> {
  const res = await apiRequest<ApiEnvelope<ProductCategoryRow>>(
    `/api/products/categories/${id}`,
    { method: "DELETE" },
  );
  if (!res.category) throw new ApiError("Invalid category response.", { status: 500 });
  return res.category;
}

export async function fetchInventoryLocations(): Promise<InventoryLocationRow[]> {
  const res = await apiRequest<ApiEnvelope<InventoryLocationRow[]>>(
    "/api/products/locations",
    { method: "GET" },
  );
  return Array.isArray(res.locations) ? res.locations : [];
}

export async function createInventoryLocation(
  input: SaveInventoryLocationInput,
): Promise<InventoryLocationRow> {
  const res = await apiRequest<ApiEnvelope<InventoryLocationRow>>(
    "/api/products/locations",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        code: cleanOptional(input.code),
        parentId: cleanOptional(input.parentId),
      }),
    },
  );
  if (!res.location) {
    throw new ApiError("Invalid inventory location response.", { status: 500 });
  }
  return res.location;
}

export async function deleteInventoryLocation(id: string): Promise<InventoryLocationRow> {
  const res = await apiRequest<ApiEnvelope<InventoryLocationRow>>(
    `/api/products/locations/${id}`,
    { method: "DELETE" },
  );
  if (!res.location) {
    throw new ApiError("Invalid inventory location response.", { status: 500 });
  }
  return res.location;
}

export async function createInventoryTransfer(
  input: SaveInventoryTransferInput,
): Promise<InventoryMovementRow> {
  const res = await apiRequest<ApiEnvelope<InventoryMovementRow>>(
    "/api/products/inventory-transfers",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        reference: cleanOptional(input.reference),
        notes: cleanOptional(input.notes),
      }),
    },
  );
  if (!res.movement) {
    throw new ApiError("Invalid inventory transfer response.", { status: 500 });
  }
  return res.movement;
}

export async function fetchUnits(): Promise<UnitRow[]> {
  const res = await apiRequest<ApiEnvelope<UnitRow[]>>("/api/products/units", {
    method: "GET",
  });
  return Array.isArray(res.units) ? res.units : [];
}

export async function createUnit(input: SaveUnitInput): Promise<UnitRow> {
  const res = await apiRequest<ApiEnvelope<UnitRow>>("/api/products/units", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
    }),
  });
  if (!res.unit) throw new ApiError("Invalid unit response.", { status: 500 });
  return res.unit;
}

export async function updateUnit(
  id: string,
  input: SaveUnitInput,
): Promise<UnitRow> {
  const res = await apiRequest<ApiEnvelope<UnitRow>>(
    `/api/products/units/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
      }),
    },
  );
  if (!res.unit) throw new ApiError("Invalid unit response.", { status: 500 });
  return res.unit;
}

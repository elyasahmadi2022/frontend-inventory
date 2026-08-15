import { ApiError, apiRequest } from "@/lib/api";

type ApiEnvelope<TData> = {
  currencies?: TData;
  currency?: TData;
};

export type CurrencyCode = "AFN" | "USD" | "PKR";

export type CurrencyRow = {
  code: CurrencyCode;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isBase: boolean;
  isActive: boolean;
};

export type SaveCurrencyInput = {
  code: CurrencyCode;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isBase: boolean;
  isActive: boolean;
};

export type ConversionRateResult = {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: number;
  path: CurrencyCode[];
};

export async function fetchConversionRate(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  effectiveAt?: string,
): Promise<ConversionRateResult> {
  const query = new URLSearchParams({ fromCurrency, toCurrency });
  if (effectiveAt) query.set("effectiveAt", effectiveAt);
  return apiRequest<ConversionRateResult>(`/api/currencies/conversion-rate?${query}`, {
    method: "GET",
  });
}

export async function fetchCurrencies(): Promise<CurrencyRow[]> {
  const res = await apiRequest<ApiEnvelope<CurrencyRow[]>>("/api/currencies", {
    method: "GET",
  });
  return Array.isArray(res.currencies) ? res.currencies : [];
}

export async function createCurrency(
  input: SaveCurrencyInput,
): Promise<CurrencyRow> {
  const res = await apiRequest<ApiEnvelope<CurrencyRow>>("/api/currencies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.currency) {
    throw new ApiError("Invalid currency response.", { status: 500 });
  }
  return res.currency;
}

export async function updateCurrency(
  code: CurrencyCode,
  input: Omit<SaveCurrencyInput, "code">,
): Promise<CurrencyRow> {
  const res = await apiRequest<ApiEnvelope<CurrencyRow>>(
    `/api/currencies/${code}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!res.currency) {
    throw new ApiError("Invalid currency response.", { status: 500 });
  }
  return res.currency;
}

export async function deleteCurrency(code: CurrencyCode): Promise<CurrencyRow> {
  const res = await apiRequest<ApiEnvelope<CurrencyRow>>(
    `/api/currencies/${code}`,
    { method: "DELETE" },
  );
  if (!res.currency) {
    throw new ApiError("Invalid currency response.", { status: 500 });
  }
  return res.currency;
}

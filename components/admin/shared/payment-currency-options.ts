import type { SelectOption } from "@/components/common/select-field";
import type { CurrencyCode } from "@/services/accounts.service";

export const PAYMENT_CURRENCY_OPTIONS: SelectOption[] = (
  ["AFN", "USD", "PKR"] as CurrencyCode[]
).map((currency) => ({ value: currency, label: currency }));

export function toPaymentExchangeRate(
  settlementCurrency: string,
  paymentCurrency: string,
  userRate: number,
): number | undefined {
  if (settlementCurrency === paymentCurrency || !(userRate > 0)) {
    return undefined;
  }
  return 1 / userRate;
}

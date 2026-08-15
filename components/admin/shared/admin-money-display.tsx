import { Fragment, type ReactNode } from "react";
import type { CurrencyTotal } from "@/services/analytics.service";
import { CurrencyFlagIcon } from "@/components/common/currency-flag-icon";

export type CurrencyAmountEntry = {
  currencyCode: string;
  amount: number;
};

function localeForLanguage(language: string) {
  return language === "en" ? "en-US" : language;
}

export function formatAdminNumber(
  value: string | number | null | undefined,
  language: string,
) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed)
    ? parsed.toLocaleString(localeForLanguage(language), {
        maximumFractionDigits: 2,
      })
    : "0";
}

export function groupCurrencyAmounts(
  rows: Array<{
    currencyCode?: string | null;
    amount?: string | number | null | undefined;
  }>,
) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const currencyCode = row.currencyCode ?? "BASE";
    const current = totals.get(currencyCode) ?? 0;
    totals.set(currencyCode, current + Number(row.amount ?? 0));
  }
  return [...totals.entries()].map(([currencyCode, amount]) => ({
    currencyCode,
    amount,
  }));
}

export function mergeCurrencyTotals(
  positive: CurrencyTotal[],
  negative: CurrencyTotal[] = [],
) {
  const totals = new Map<string, number>();
  for (const item of positive) {
    totals.set(item.currencyCode, (totals.get(item.currencyCode) ?? 0) + Number(item.total ?? 0));
  }
  for (const item of negative) {
    totals.set(item.currencyCode, (totals.get(item.currencyCode) ?? 0) - Number(item.total ?? 0));
  }
  return [...totals.entries()].map(([currencyCode, amount]) => ({
    currencyCode,
    amount,
  }));
}

export function totalCurrencyAmount(entries: CurrencyAmountEntry[]) {
  return entries.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
}

export function renderCurrencyAmountList(
  entries: CurrencyAmountEntry[],
  language: string,
  emptyLabel = "0",
): ReactNode {
  if (entries.length === 0) return emptyLabel;

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
      {entries.map((item, index) => (
        <Fragment key={`${item.currencyCode}-${index}`}>
          <span
            dir="ltr"
            className="inline-flex items-baseline whitespace-nowrap [unicode-bidi:isolate]"
          >
            <span>{formatAdminNumber(item.amount, language)}</span>
            <CurrencyFlagIcon currency={item.currencyCode} className="ms-1 h-4 w-6" />
            <span className="sr-only">{item.currencyCode}</span>
          </span>
          {index < entries.length - 1 ? (
            <span className="text-light-muted dark:text-dark-muted">·</span>
          ) : null}
        </Fragment>
      ))}
    </span>
  );
}

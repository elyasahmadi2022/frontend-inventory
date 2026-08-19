"use client";

import { gooeyToast } from "goey-toast";
import { useEffect, useMemo, useState } from "react";
import {
  buildAssetAccountOptions,
  renderAssetAccountOption,
} from "@/components/admin/shared/asset-account-options";
import { PAYMENT_CURRENCY_OPTIONS } from "@/components/admin/shared/payment-currency-options";
import { FormModal } from "@/components/common/form-modal";
import { MultiSelectField } from "@/components/common/multi-select-field";
import { ToggleSwitch } from "@/components/common/toggle-switch";
import { DatePickerField } from "@/components/common/date-picker-field";
import { InputField } from "@/components/common/input-field";
import {
  SelectField,
  type SelectOption,
} from "@/components/common/select-field";
import { TextareaField } from "@/components/common/textarea-field";
import { ApiError } from "@/lib/api";
import { getLocalDateString } from "@/lib/date-format";
import { useI18n } from "@/lib/i18n";
import { useReceiveAdminSalePaymentMutation } from "@/lib/query/hooks";
import type { AccountRow, CurrencyCode } from "@/services/accounts.service";
import type { SaleRow } from "@/services/sales.service";

type Props = {
  accounts: AccountRow[];
  open: boolean;
  sale: SaleRow | null;
  sales?: SaleRow[];
  onClose: () => void;
};

export function AdminSalePaymentModal({
  accounts,
  open,
  sale,
  sales = [],
  onClose,
}: Props) {
  const { language, t } = useI18n();
  const mutation = useReceiveAdminSalePaymentMutation();
  const balance = Math.max(
    Number(sale?.total ?? 0) - Number(sale?.paidTotal ?? 0),
    0,
  );
  const [amount, setAmount] = useState(balance);
  const [paymentCurrencyCode, setPaymentCurrencyCode] = useState<
    CurrencyCode | ""
  >("");
  const [paymentExchangeRateInputs, setPaymentExchangeRateInputs] = useState<
    Partial<Record<CurrencyCode, string>>
  >({});
  const [receiptAccountId, setReceiptAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(getLocalDateString);
  const [notes, setNotes] = useState("");
  const [payMultiple, setPayMultiple] = useState(false);
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);
  const [multipleAmount, setMultipleAmount] = useState(0);

  const payableSales = useMemo(
    () =>
      sales.filter(
        (item) =>
          item.status !== "cancelled" &&
          Number(item.total) - Number(item.paidTotal) > 0,
      ),
    [sales],
  );
  const selectedSales = payableSales
    .filter((item) => selectedSaleIds.includes(item.id))
    .sort(
      (left, right) =>
        new Date(left.invoiceDate).getTime() -
        new Date(right.invoiceDate).getTime(),
    );
  const totalSelectedAmount = selectedSales.reduce(
    (sum, item) => sum + Number(item.total) - Number(item.paidTotal),
    0,
  );
  const paymentTargets = payMultiple ? selectedSales : sale ? [sale] : [];
  const selectedCurrencies = [
    ...new Set(paymentTargets.map((item) => item.currencyCode)),
  ];
  const foreignCurrencies = selectedCurrencies.filter(
    (currency) => currency !== paymentCurrencyCode,
  );
  const exchangeRateCurrencies = foreignCurrencies.length
    ? ([
        ...new Set(
          [paymentCurrencyCode, ...selectedCurrencies].filter(
            (currency): currency is CurrencyCode =>
              Boolean(currency) && currency !== "USD",
          ),
        ),
      ] as CurrencyCode[])
    : [];
  const selectedSalesUseOneCurrency = selectedCurrencies.length <= 1;
  const hasRequiredExchangeRates = exchangeRateCurrencies.every(
    (currency) => Number(paymentExchangeRateInputs[currency]) > 0,
  );
  const paymentRateToUsd =
    paymentCurrencyCode === "USD"
      ? 1
      : Number(paymentExchangeRateInputs[paymentCurrencyCode as CurrencyCode]);
  const totalPaymentAmount = hasRequiredExchangeRates
    ? paymentTargets.reduce((sum, target) => {
        const outstanding = Math.max(
          Number(target.total) - Number(target.paidTotal),
          0,
        );
        if (target.currencyCode === paymentCurrencyCode)
          return sum + outstanding;
        const documentRateToUsd =
          target.currencyCode === "USD"
            ? 1
            : Number(paymentExchangeRateInputs[target.currencyCode]);
        return sum + outstanding * (paymentRateToUsd / documentRateToUsd);
      }, 0)
    : 0;

  useEffect(() => {
    if (!open || !sale) return;
    const frame = requestAnimationFrame(() => {
      setAmount(Math.max(Number(sale.total) - Number(sale.paidTotal), 0));
      setPaymentCurrencyCode(sale.currencyCode);
      setPaymentExchangeRateInputs({});
      setReceiptAccountId("");
      setPaymentDate(getLocalDateString());
      setNotes("");
      setPayMultiple(false);
      setSelectedSaleIds([sale.id]);
      setMultipleAmount(
        Math.max(Number(sale.total) - Number(sale.paidTotal), 0),
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [open, sale]);

  const accountById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );
  const accountOptions = useMemo<SelectOption[]>(
    () =>
      paymentCurrencyCode
        ? buildAssetAccountOptions(accounts, paymentCurrencyCode, language)
        : [],
    [accounts, language, paymentCurrencyCode],
  );

  const handleSubmit = async () => {
    if (!sale) return;
    if (payMultiple && paymentTargets.length === 0) {
      gooeyToast.error(t("admin.sales.pay.errorTitle"), {
        description: t("admin.sales.pay.validation.selectInvoices"),
      });
      return;
    }
    if (!((payMultiple ? multipleAmount : amount) > 0)) {
      gooeyToast.error(t("admin.sales.pay.errorTitle"), {
        description: t("admin.sales.pay.validation.amountRequired"),
      });
      return;
    }
    if (
      (payMultiple ? multipleAmount : amount) >
      (payMultiple ? totalPaymentAmount : balance)
    ) {
      gooeyToast.error(t("admin.sales.pay.errorTitle"), {
        description: t("admin.sales.pay.validation.amountTooHigh"),
      });
      return;
    }
    for (const currency of exchangeRateCurrencies) {
      if (!(Number(paymentExchangeRateInputs[currency]) > 0)) {
        gooeyToast.error(t("admin.sales.pay.errorTitle"), {
          description: t("admin.sales.pay.validation.exchangeRate"),
        });
        return;
      }
    }
    if (!receiptAccountId) {
      gooeyToast.error(t("admin.sales.pay.errorTitle"), {
        description: t("admin.sales.pay.validation.accountRequired"),
      });
      return;
    }

    try {
      let remainingAmount = payMultiple ? multipleAmount : amount;
      for (const target of paymentTargets) {
        const paymentPerDocument =
          target.currencyCode === paymentCurrencyCode
            ? 1
            : (paymentCurrencyCode === "USD"
                ? 1
                : Number(
                    paymentExchangeRateInputs[
                      paymentCurrencyCode as CurrencyCode
                    ],
                  )) /
              (target.currencyCode === "USD"
                ? 1
                : Number(paymentExchangeRateInputs[target.currencyCode]));
        const targetAmount = payMultiple
          ? Math.min(
              Math.max(Number(target.total) - Number(target.paidTotal), 0),
              remainingAmount / paymentPerDocument,
            )
          : amount;
        if (!(targetAmount > 0)) continue;
        const paymentExchangeRateValue =
          target.currencyCode === paymentCurrencyCode
            ? undefined
            : paymentPerDocument;
        await mutation.mutateAsync({
          id: target.id,
          input: {
            amount: targetAmount,
            receiptAccountId,
            paymentDate,
            notes: notes.trim() || undefined,
            paymentExchangeRate: paymentExchangeRateValue,
          },
        });
        if (payMultiple) remainingAmount -= targetAmount * paymentPerDocument;
      }
      gooeyToast.success(t("admin.sales.pay.successTitle"), {
        description: t("admin.sales.pay.successDescription", {
          number: sale.number,
        }),
      });
      onClose();
    } catch (error) {
      gooeyToast.error(t("admin.sales.pay.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.sales.pay.errorFallback"),
      });
    }
  };

  return (
    <FormModal
      open={open}
      title={t("admin.sales.pay.title")}
      description={
        sale ? (
          <>
            {t("admin.sales.pay.description", {
              number: sale.number,
              currency: sale.currencyCode,
            })}{" "}
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {balance.toLocaleString()} {sale.currencyCode}
            </span>
          </>
        ) : undefined
      }
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
      submitting={mutation.isPending}
      submitLabel={t("admin.sales.pay.submit")}
      submittingLabel={t("admin.sales.pay.submitting")}
      cancelLabel={t("admin.sales.pay.cancel")}
      closeLabel={t("admin.sales.pay.close")}
    >
      <div className="col-span-2">
        <SelectField
          label={t("admin.sales.pay.paymentCurrency")}
          options={PAYMENT_CURRENCY_OPTIONS}
          value={paymentCurrencyCode}
          onValueChange={(value) => {
            const currency = value as CurrencyCode;
            const matchingSales = payableSales.filter(
              (item) => item.currencyCode === currency,
            );
            const total = matchingSales.reduce(
              (sum, item) => sum + Number(item.total) - Number(item.paidTotal),
              0,
            );
            setPaymentCurrencyCode(currency);
            setPaymentExchangeRateInputs({});
            setReceiptAccountId("");
            setSelectedSaleIds(matchingSales.map((item) => item.id));
            setMultipleAmount(total);
            if (!payMultiple) setAmount(balance);
          }}
          tone="light"
          clearable={false}
        />
      </div>
      {!(payMultiple && !selectedSalesUseOneCurrency) ? (
        <p className="col-span-2 text-sm font-semibold text-green-700 dark:text-green-400">
          {t("admin.sales.pay.remainingAfterPayment")}:{" "}
          {Math.max(
            payMultiple
              ? totalSelectedAmount - multipleAmount
              : balance - amount,
            0,
          ).toLocaleString()}{" "}
          {selectedCurrencies[0] ?? sale?.currencyCode}
        </p>
      ) : null}
      {payableSales.length > 1 ? (
        <div className="col-span-2">
          <ToggleSwitch
            id="sale-pay-multiple"
            checked={payMultiple}
            onCheckedChange={(checked) => {
              setPayMultiple(checked);
              if (checked) {
                const matchingSales = payableSales.filter(
                  (item) => item.currencyCode === paymentCurrencyCode,
                );
                setSelectedSaleIds(matchingSales.map((item) => item.id));
                setMultipleAmount(
                  matchingSales.reduce(
                    (sum, item) =>
                      sum + Number(item.total) - Number(item.paidTotal),
                    0,
                  ),
                );
              }
            }}
            label={t("admin.sales.pay.multiple")}
          />
        </div>
      ) : null}
      {payMultiple ? (
        <>
          <div className="col-span-2 w-full">
            <MultiSelectField
              className="w-full"
              label={t("admin.sales.pay.selectInvoices")}
              options={payableSales.map((item) => ({
                value: item.id,
                label: `${item.number} — ${Math.max(Number(item.total) - Number(item.paidTotal), 0).toLocaleString()} ${item.currencyCode}`,
              }))}
              value={selectedSaleIds}
              onValueChange={(nextIds) => {
                setSelectedSaleIds(nextIds);
                setMultipleAmount(
                  payableSales
                    .filter((item) => nextIds.includes(item.id))
                    .reduce(
                      (sum, item) =>
                        sum + Number(item.total) - Number(item.paidTotal),
                      0,
                    ),
                );
              }}
              tone="light"
            />
          </div>
          <p className="col-span-2 order-20 text-sm font-semibold text-green-700 dark:text-green-400">
            {t("admin.sales.pay.totalSelected")}:{" "}
            {selectedCurrencies
              .map((currency) => {
                const total = selectedSales
                  .filter((item) => item.currencyCode === currency)
                  .reduce(
                    (sum, item) =>
                      sum + Number(item.total) - Number(item.paidTotal),
                    0,
                  );
                if (
                  hasRequiredExchangeRates &&
                  currency !== paymentCurrencyCode
                ) {
                  const paymentRate =
                    paymentCurrencyCode === "USD"
                      ? 1
                      : Number(
                          paymentExchangeRateInputs[
                            paymentCurrencyCode as CurrencyCode
                          ],
                        );
                  const documentRate =
                    currency === "USD"
                      ? 1
                      : Number(paymentExchangeRateInputs[currency]);
                  const conversionRate = paymentRate / documentRate;
                  return `${total.toLocaleString()} ${currency} (${total.toLocaleString()} × ${conversionRate.toLocaleString()} = ${(total * conversionRate).toLocaleString()} ${paymentCurrencyCode})`;
                }
                return `${total.toLocaleString()} ${currency}`;
              })
              .join(" · ")}
          </p>
          <InputField
            containerClassName="col-span-2 order-30"
            id="sale-pay-multiple-amount"
            label={`${t("admin.sales.pay.amount")} (${paymentCurrencyCode})`}
            type="number"
            min={0}
            max={hasRequiredExchangeRates ? totalPaymentAmount : undefined}
            step="0.01"
            value={multipleAmount}
            onChange={(event) =>
              setMultipleAmount(Number(event.target.value) || 0)
            }
            tone="light"
          />
        </>
      ) : (
        <InputField
          containerClassName="col-span-2"
          id="sale-pay-amount"
          label={t("admin.sales.pay.amount")}
          type="number"
          min={0}
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value) || 0)}
          tone="light"
        />
      )}
      {exchangeRateCurrencies.map((currency) => {
        const rate = Number(paymentExchangeRateInputs[currency]);
        return (
          <div className="col-span-2 order-10" key={currency}>
            <InputField
              id={`sale-pay-exchange-rate-${currency}`}
              label={`1 USD = ? ${currency}`}
              type="number"
              min={0.000001}
              step="0.000001"
              value={paymentExchangeRateInputs[currency] ?? ""}
              onChange={(event) => {
                const nextRates = {
                  ...paymentExchangeRateInputs,
                  [currency]: event.target.value,
                };
                setPaymentExchangeRateInputs(nextRates);
                if (
                  payMultiple &&
                  exchangeRateCurrencies.every(
                    (code) => Number(nextRates[code]) > 0,
                  )
                ) {
                  const paymentRate =
                    paymentCurrencyCode === "USD"
                      ? 1
                      : Number(nextRates[paymentCurrencyCode as CurrencyCode]);
                  setMultipleAmount(
                    paymentTargets.reduce((sum, target) => {
                      const outstanding = Math.max(
                        Number(target.total) - Number(target.paidTotal),
                        0,
                      );
                      if (target.currencyCode === paymentCurrencyCode) {
                        return sum + outstanding;
                      }
                      const documentRate =
                        target.currencyCode === "USD"
                          ? 1
                          : Number(nextRates[target.currencyCode]);
                      return sum + outstanding * (paymentRate / documentRate);
                    }, 0),
                  );
                }
              }}
              tone="light"
            />
            {rate > 0 ? (
              <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
                Enter how many {currency} equal one US dollar.
              </p>
            ) : null}
          </div>
        );
      })}
      <div className="col-span-2 order-40">
        <SelectField
          label={t("admin.sales.pay.account")}
          options={accountOptions}
          value={receiptAccountId}
          onValueChange={setReceiptAccountId}
          renderOption={(option) =>
            paymentCurrencyCode
              ? renderAssetAccountOption(
                  option,
                  accountById,
                  paymentCurrencyCode,
                  language,
                )
              : option.label
          }
          tone="light"
        />
      </div>
      <DatePickerField
        containerClassName="col-span-2 order-50"
        id="sale-pay-date"
        label={t("admin.sales.pay.date")}
        value={paymentDate}
        onChange={setPaymentDate}
        tone="light"
      />
      <TextareaField
        containerClassName="col-span-2 order-60"
        id="sale-pay-notes"
        label={t("admin.sales.pay.notes")}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        tone="light"
      />
    </FormModal>
  );
}

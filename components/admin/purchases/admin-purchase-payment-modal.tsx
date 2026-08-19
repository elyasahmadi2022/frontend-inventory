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
import { usePayAdminPurchaseMutation } from "@/lib/query/hooks";
import type { AccountRow, CurrencyCode } from "@/services/accounts.service";
import type { PurchaseRow } from "@/services/purchases.service";

type Props = {
  accounts: AccountRow[];
  open: boolean;
  purchase: PurchaseRow | null;
  purchases?: PurchaseRow[];
  onClose: () => void;
};

export function AdminPurchasePaymentModal({
  accounts,
  open,
  purchase,
  purchases = [],
  onClose,
}: Props) {
  const { language, t } = useI18n();
  const mutation = usePayAdminPurchaseMutation();
  const balance = Math.max(
    Number(purchase?.total ?? 0) - Number(purchase?.paidTotal ?? 0),
    0,
  );
  const [amount, setAmount] = useState(balance);
  const [paymentCurrencyCode, setPaymentCurrencyCode] = useState<
    CurrencyCode | ""
  >("");
  const [paymentExchangeRateInputs, setPaymentExchangeRateInputs] = useState<
    Partial<Record<CurrencyCode, string>>
  >({});
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(getLocalDateString);
  const [notes, setNotes] = useState("");
  const [payMultiple, setPayMultiple] = useState(false);
  const [selectedPurchaseIds, setSelectedPurchaseIds] = useState<string[]>([]);
  const [multipleAmount, setMultipleAmount] = useState(0);

  const payablePurchases = useMemo(
    () =>
      purchases.filter(
        (item) =>
          item.status !== "cancelled" &&
          Number(item.total) - Number(item.paidTotal) > 0,
      ),
    [purchases],
  );
  const selectedPurchases = payablePurchases
    .filter((item) => selectedPurchaseIds.includes(item.id))
    .sort(
      (left, right) =>
        new Date(left.billDate).getTime() - new Date(right.billDate).getTime(),
    );
  const totalSelectedAmount = selectedPurchases.reduce(
    (sum, item) => sum + Number(item.total) - Number(item.paidTotal),
    0,
  );
  const paymentTargets = payMultiple
    ? selectedPurchases
    : purchase
      ? [purchase]
      : [];
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
  const selectedPurchasesUseOneCurrency = selectedCurrencies.length <= 1;
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
    if (!open || !purchase) return;
    const frame = requestAnimationFrame(() => {
      setAmount(
        Math.max(Number(purchase.total) - Number(purchase.paidTotal), 0),
      );
      setPaymentCurrencyCode(purchase.currencyCode);
      setPaymentExchangeRateInputs({});
      setPaymentAccountId("");
      setPaymentDate(getLocalDateString());
      setNotes("");
      setPayMultiple(false);
      setSelectedPurchaseIds([purchase.id]);
      setMultipleAmount(
        Math.max(Number(purchase.total) - Number(purchase.paidTotal), 0),
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [open, purchase]);

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
    if (!purchase) return;
    if (payMultiple && paymentTargets.length === 0) {
      gooeyToast.error(t("admin.purchases.pay.errorTitle"), {
        description: t("admin.purchases.pay.validation.selectBills"),
      });
      return;
    }
    if (!((payMultiple ? multipleAmount : amount) > 0)) {
      gooeyToast.error(t("admin.purchases.pay.errorTitle"), {
        description: t("admin.purchases.pay.validation.amountRequired"),
      });
      return;
    }
    if (
      (payMultiple ? multipleAmount : amount) >
      (payMultiple ? totalPaymentAmount : balance)
    ) {
      gooeyToast.error(t("admin.purchases.pay.errorTitle"), {
        description: t("admin.purchases.pay.validation.amountTooHigh"),
      });
      return;
    }
    for (const currency of exchangeRateCurrencies) {
      if (!(Number(paymentExchangeRateInputs[currency]) > 0)) {
        gooeyToast.error(t("admin.purchases.pay.errorTitle"), {
          description: t("admin.purchases.pay.validation.exchangeRate"),
        });
        return;
      }
    }
    if (!paymentAccountId) {
      gooeyToast.error(t("admin.purchases.pay.errorTitle"), {
        description: t("admin.purchases.pay.validation.accountRequired"),
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
            paymentAccountId,
            paymentDate,
            notes: notes.trim() || undefined,
            paymentExchangeRate: paymentExchangeRateValue,
          },
        });
        if (payMultiple) remainingAmount -= targetAmount * paymentPerDocument;
      }
      gooeyToast.success(t("admin.purchases.pay.successTitle"), {
        description: t("admin.purchases.pay.successDescription", {
          number: purchase.number,
        }),
      });
      onClose();
    } catch (error) {
      gooeyToast.error(t("admin.purchases.pay.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.purchases.pay.errorFallback"),
      });
    }
  };

  return (
    <FormModal
      open={open}
      title={t("admin.purchases.pay.title")}
      description={
        purchase ? (
          <>
            {t("admin.purchases.pay.description", {
              number: purchase.number,
              currency: purchase.currencyCode,
            })}{" "}
            <span className="font-semibold text-rose-700 dark:text-rose-400">
              {balance.toLocaleString()} {purchase.currencyCode}
            </span>
          </>
        ) : undefined
      }
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
      submitting={mutation.isPending}
      submitLabel={t("admin.purchases.pay.submit")}
      submittingLabel={t("admin.purchases.pay.submitting")}
      cancelLabel={t("admin.purchases.pay.cancel")}
      closeLabel={t("admin.purchases.pay.close")}
    >
      <div className="col-span-2 order-40">
        <SelectField
          label={t("admin.purchases.pay.paymentCurrency")}
          options={PAYMENT_CURRENCY_OPTIONS}
          value={paymentCurrencyCode}
          onValueChange={(value) => {
            const currency = value as CurrencyCode;
            const matchingPurchases = payablePurchases.filter(
              (item) => item.currencyCode === currency,
            );
            const total = matchingPurchases.reduce(
              (sum, item) => sum + Number(item.total) - Number(item.paidTotal),
              0,
            );
            setPaymentCurrencyCode(currency);
            setPaymentExchangeRateInputs({});
            setPaymentAccountId("");
            setSelectedPurchaseIds(matchingPurchases.map((item) => item.id));
            setMultipleAmount(total);
            if (!payMultiple) setAmount(balance);
          }}
          tone="light"
          clearable={false}
        />
      </div>
      {!(payMultiple && !selectedPurchasesUseOneCurrency) ? (
        <p className="col-span-2 text-sm font-semibold text-green-700 dark:text-green-400">
          {t("admin.purchases.pay.remainingAfterPayment")}:{" "}
          {Math.max(
            payMultiple
              ? totalSelectedAmount - multipleAmount
              : balance - amount,
            0,
          ).toLocaleString()}{" "}
          {selectedCurrencies[0] ?? purchase?.currencyCode}
        </p>
      ) : null}
      {payablePurchases.length > 1 ? (
        <div className="col-span-2">
          <ToggleSwitch
            id="purchase-pay-multiple"
            checked={payMultiple}
            onCheckedChange={(checked) => {
              setPayMultiple(checked);
              if (checked) {
                const matchingPurchases = payablePurchases.filter(
                  (item) => item.currencyCode === paymentCurrencyCode,
                );
                setSelectedPurchaseIds(
                  matchingPurchases.map((item) => item.id),
                );
                setMultipleAmount(
                  matchingPurchases.reduce(
                    (sum, item) =>
                      sum + Number(item.total) - Number(item.paidTotal),
                    0,
                  ),
                );
              }
            }}
            label={t("admin.purchases.pay.multiple")}
          />
        </div>
      ) : null}
      {payMultiple ? (
        <>
          <div className="col-span-2 w-full">
            <MultiSelectField
              className="w-full"
              label={t("admin.purchases.pay.selectBills")}
              options={payablePurchases.map((item) => ({
                value: item.id,
                label: `${item.number} — ${Math.max(Number(item.total) - Number(item.paidTotal), 0).toLocaleString()} ${item.currencyCode}`,
              }))}
              value={selectedPurchaseIds}
              onValueChange={(nextIds) => {
                setSelectedPurchaseIds(nextIds);
                setMultipleAmount(
                  payablePurchases
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
          <p className="col-span-2 text-sm font-semibold text-red-700 dark:text-red-400">
            {t("admin.purchases.pay.totalSelected")}:{" "}
            {selectedCurrencies
              .map((currency) => {
                const total = selectedPurchases
                  .filter((item) => item.currencyCode === currency)
                  .reduce(
                    (sum, item) =>
                      sum + Number(item.total) - Number(item.paidTotal),
                    0,
                  );
                return `${total.toLocaleString()} ${currency}`;
              })
              .join(" · ")}
          </p>
          <InputField
            containerClassName="col-span-2"
            id="purchase-pay-multiple-amount"
            label={`${t("admin.purchases.pay.amount")} (${paymentCurrencyCode})`}
            type="number"
            min={0}
            max={
              selectedPurchasesUseOneCurrency ? totalSelectedAmount : undefined
            }
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
          id="purchase-pay-amount"
          label={t("admin.purchases.pay.amount")}
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
          <div className="col-span-2" key={currency}>
            <InputField
              id={`purchase-pay-exchange-rate-${currency}`}
              label={`1 USD = ? ${currency}`}
              type="number"
              min={0.000001}
              step="0.000001"
              value={paymentExchangeRateInputs[currency] ?? ""}
              onChange={(event) =>
                setPaymentExchangeRateInputs((current) => ({
                  ...current,
                  [currency]: event.target.value,
                }))
              }
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
      <div className="col-span-2">
        <SelectField
          label={t("admin.purchases.pay.account")}
          options={accountOptions}
          value={paymentAccountId}
          onValueChange={setPaymentAccountId}
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
        id="purchase-pay-date"
        label={t("admin.purchases.pay.date")}
        value={paymentDate}
        onChange={setPaymentDate}
        tone="light"
      />
      <TextareaField
        containerClassName="col-span-2 order-60"
        id="purchase-pay-notes"
        label={t("admin.purchases.pay.notes")}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        tone="light"
      />
    </FormModal>
  );
}

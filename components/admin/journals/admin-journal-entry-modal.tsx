"use client";

import { gooeyToast } from "goey-toast";
import { useEffect, useMemo, useState } from "react";
import {
  buildAssetAccountOptions,
  renderAssetAccountOption,
} from "@/components/admin/shared/asset-account-options";
import { PAYMENT_CURRENCY_OPTIONS } from "@/components/admin/shared/payment-currency-options";
import { DatePickerField } from "@/components/common/date-picker-field";
import { FormModal } from "@/components/common/form-modal";
import { InputField } from "@/components/common/input-field";
import { MultiSelectField } from "@/components/common/multi-select-field";
import {
  SelectField,
  type SelectOption,
} from "@/components/common/select-field";
import { TextareaField } from "@/components/common/textarea-field";
import { ToggleSwitch } from "@/components/common/toggle-switch";
import { ApiError } from "@/lib/api";
import { getLocalDateString } from "@/lib/date-format";
import { useI18n } from "@/lib/i18n";
import {
  useAdminAccountsQuery,
  useAdminPartnersQuery,
  useAdminPurchasesQuery,
  useAdminSalesQuery,
  usePayAdminPurchaseMutation,
  useReceiveAdminSalePaymentMutation,
} from "@/lib/query/hooks";
import type { CurrencyCode } from "@/services/accounts.service";

type Props = {
  open: boolean;
  onClose: () => void;
  initialPartnerId?: string;
  initialPartnerType?: "customer" | "vendor";
};
type OutstandingTransaction = {
  id: string;
  number: string;
  currencyCode: CurrencyCode;
  balance: number;
  date: string;
};

export function AdminJournalEntryModal({
  open,
  onClose,
  initialPartnerId,
  initialPartnerType,
}: Props) {
  const { language, t } = useI18n();
  const accountsQuery = useAdminAccountsQuery({ isActive: true, limit: 100 });
  const partnersQuery = useAdminPartnersQuery({ isActive: true, limit: 100 });
  const receiveMutation = useReceiveAdminSalePaymentMutation();
  const payMutation = usePayAdminPurchaseMutation();
  const [cashIn, setCashIn] = useState(true);
  const [partnerId, setPartnerId] = useState("");
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<
    string[]
  >([]);
  const [paymentCurrencyCode, setPaymentCurrencyCode] = useState<
    CurrencyCode | ""
  >("");
  const [paymentExchangeRateInputs, setPaymentExchangeRateInputs] = useState<
    Partial<Record<CurrencyCode, string>>
  >({});
  const [amount, setAmount] = useState(0);
  const [accountId, setAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(getLocalDateString);
  const [notes, setNotes] = useState("");

  const salesQuery = useAdminSalesQuery(
    cashIn && partnerId
      ? { customerId: partnerId, limit: 100 }
      : { page: 1, limit: 0 },
  );
  const purchasesQuery = useAdminPurchasesQuery(
    !cashIn && partnerId
      ? { vendorId: partnerId, limit: 100 }
      : { page: 1, limit: 0 },
  );

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      setCashIn(initialPartnerType ? initialPartnerType === "customer" : true);
      setPartnerId(initialPartnerId ?? "");
      setSelectedTransactionIds([]);
      setPaymentCurrencyCode("");
      setPaymentExchangeRateInputs({});
      setAmount(0);
      setAccountId("");
      setPaymentDate(getLocalDateString());
      setNotes("");
    });
    return () => cancelAnimationFrame(frame);
  }, [open, initialPartnerId, initialPartnerType]);

  const partners = useMemo(
    () =>
      (partnersQuery.data?.items ?? []).filter((partner) =>
        cashIn
          ? ["customer", "both"].includes(partner.type)
          : ["vendor", "both"].includes(partner.type),
      ),
    [cashIn, partnersQuery.data?.items],
  );
  const partnerOptions = useMemo<SelectOption[]>(
    () =>
      partners.map((partner) => ({
        value: partner.id,
        label: partner.name,
        description: t(`admin.partners.type.${partner.type}` as never),
        searchText: `${partner.code} ${partner.name} ${partner.type}`,
      })),
    [partners, t],
  );

  const outstandingTransactions = useMemo<OutstandingTransaction[]>(() => {
    if (cashIn)
      return (salesQuery.data?.items ?? [])
        .filter((sale) => sale.status !== "cancelled")
        .map((sale) => ({
          id: sale.id,
          number: sale.number,
          currencyCode: sale.currencyCode,
          balance: Math.max(Number(sale.total) - Number(sale.paidTotal), 0),
          date: sale.invoiceDate,
        }))
        .filter((sale) => sale.balance > 0)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
    return (purchasesQuery.data?.items ?? [])
      .filter((purchase) => purchase.status !== "cancelled")
      .map((purchase) => ({
        id: purchase.id,
        number: purchase.number,
        currencyCode: purchase.currencyCode,
        balance: Math.max(
          Number(purchase.total) - Number(purchase.paidTotal),
          0,
        ),
        date: purchase.billDate,
      }))
      .filter((purchase) => purchase.balance > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [cashIn, purchasesQuery.data?.items, salesQuery.data?.items]);
  const selectedTransactions = outstandingTransactions.filter((transaction) =>
    selectedTransactionIds.includes(transaction.id),
  );
  const settlementCurrency = selectedTransactions[0]?.currencyCode ?? "";
  const selectedCurrencies = [
    ...new Set(
      selectedTransactions.map((transaction) => transaction.currencyCode),
    ),
  ];
  const exchangeRateCurrencies = selectedCurrencies.some(
    (currency) => currency !== paymentCurrencyCode,
  )
    ? ([
        ...new Set(
          [paymentCurrencyCode, ...selectedCurrencies].filter(
            (currency): currency is CurrencyCode =>
              Boolean(currency) && currency !== "USD",
          ),
        ),
      ] as CurrencyCode[])
    : [];
  const hasRequiredExchangeRates = exchangeRateCurrencies.every(
    (currency) => Number(paymentExchangeRateInputs[currency]) > 0,
  );
  const totalPaymentAmount = hasRequiredExchangeRates
    ? selectedTransactions.reduce((sum, transaction) => {
        if (transaction.currencyCode === paymentCurrencyCode)
          return sum + transaction.balance;
        const paymentRate =
          paymentCurrencyCode === "USD"
            ? 1
            : Number(
                paymentExchangeRateInputs[paymentCurrencyCode as CurrencyCode],
              );
        const transactionRate =
          transaction.currencyCode === "USD"
            ? 1
            : Number(paymentExchangeRateInputs[transaction.currencyCode]);
        return sum + transaction.balance * (paymentRate / transactionRate);
      }, 0)
    : 0;
  const accountById = useMemo(
    () =>
      new Map(
        (accountsQuery.data ?? []).map((account) => [account.id, account]),
      ),
    [accountsQuery.data],
  );
  const accountOptions = useMemo<SelectOption[]>(
    () =>
      paymentCurrencyCode
        ? buildAssetAccountOptions(
            accountsQuery.data ?? [],
            paymentCurrencyCode,
            language,
          )
        : [],
    [accountsQuery.data, language, paymentCurrencyCode],
  );

  const resetTransactionSelection = () => {
    setSelectedTransactionIds([]);
    setPaymentCurrencyCode("");
    setPaymentExchangeRateInputs({});
    setAmount(0);
    setAccountId("");
  };
  const selectCashDirection = (nextCashIn: boolean) => {
    setCashIn(nextCashIn);
    setPartnerId("");
    resetTransactionSelection();
  };
  const selectPartner = (value: string) => {
    setPartnerId(value);
    resetTransactionSelection();
  };
  const selectTransactions = (nextIds: string[]) => {
    const firstSelected = outstandingTransactions.find((transaction) =>
      nextIds.includes(transaction.id),
    );
    const total = outstandingTransactions
      .filter((transaction) => nextIds.includes(transaction.id))
      .reduce((sum, transaction) => sum + transaction.balance, 0);
    setSelectedTransactionIds(nextIds);
    setPaymentCurrencyCode(firstSelected?.currencyCode ?? "");
    setPaymentExchangeRateInputs({});
    setAmount(total);
    setAccountId("");
  };

  const handleSubmit = async () => {
    if (!partnerId)
      return gooeyToast.error(t("admin.journals.entry.errorTitle"), {
        description: t("admin.journals.entry.validation.partner"),
      });
    if (!settlementCurrency || selectedTransactions.length === 0)
      return gooeyToast.error(t("admin.journals.entry.errorTitle"), {
        description: t("admin.journals.entry.validation.transactions"),
      });
    if (!paymentCurrencyCode)
      return gooeyToast.error(t("admin.journals.entry.errorTitle"), {
        description: t("admin.journals.entry.validation.paymentCurrency"),
      });
    if (!(amount > 0))
      return gooeyToast.error(t("admin.journals.entry.errorTitle"), {
        description: t("admin.journals.entry.validation.amount"),
      });
    if (amount > totalPaymentAmount)
      return gooeyToast.error(t("admin.journals.entry.errorTitle"), {
        description: t("admin.journals.entry.validation.amountTooHigh"),
      });
    if (!hasRequiredExchangeRates)
      return gooeyToast.error(t("admin.journals.entry.errorTitle"), {
        description: t("admin.journals.entry.validation.exchangeRate"),
      });
    if (!accountId)
      return gooeyToast.error(t("admin.journals.entry.errorTitle"), {
        description: t("admin.journals.entry.validation.account"),
      });
    try {
      let remainingAmount = amount;
      for (const transaction of selectedTransactions) {
        const paymentPerTransaction =
          transaction.currencyCode === paymentCurrencyCode
            ? 1
            : (paymentCurrencyCode === "USD"
                ? 1
                : Number(
                    paymentExchangeRateInputs[
                      paymentCurrencyCode as CurrencyCode
                    ],
                  )) /
              (transaction.currencyCode === "USD"
                ? 1
                : Number(paymentExchangeRateInputs[transaction.currencyCode]));
        const transactionAmount = Math.min(
          transaction.balance,
          remainingAmount / paymentPerTransaction,
        );
        if (!(transactionAmount > 0)) continue;
        const paymentExchangeRateValue =
          transaction.currencyCode === paymentCurrencyCode
            ? undefined
            : paymentPerTransaction;
        if (cashIn)
          await receiveMutation.mutateAsync({
            id: transaction.id,
            input: {
              amount: transactionAmount,
              receiptAccountId: accountId,
              paymentDate,
              notes: notes.trim() || undefined,
              paymentExchangeRate: paymentExchangeRateValue,
            },
          });
        else
          await payMutation.mutateAsync({
            id: transaction.id,
            input: {
              amount: transactionAmount,
              paymentAccountId: accountId,
              paymentDate,
              notes: notes.trim() || undefined,
              paymentExchangeRate: paymentExchangeRateValue,
            },
          });
        remainingAmount -= transactionAmount * paymentPerTransaction;
      }
      gooeyToast.success(t("admin.journals.entry.successTitle"), {
        description: t("admin.journals.entry.successDescription"),
      });
      onClose();
    } catch (error) {
      gooeyToast.error(t("admin.journals.entry.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.journals.entry.errorFallback"),
      });
    }
  };

  const accountLabel = cashIn
    ? t("admin.journals.entry.receivingAccount")
    : t("admin.journals.entry.paymentAccount");
  const paymentCurrencyLabel = cashIn
    ? t("admin.journals.entry.receiptCurrency")
    : t("admin.journals.entry.paymentCurrency");
  const transactionLabel = cashIn
    ? t("admin.journals.entry.selectInvoices")
    : t("admin.journals.entry.selectBills");
  const isLoadingTransactions = cashIn
    ? salesQuery.isLoading
    : purchasesQuery.isLoading;

  return (
    <FormModal
      open={open}
      title={t("admin.journals.entry.title")}
      description={t("admin.journals.entry.description")}
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
      submitting={receiveMutation.isPending || payMutation.isPending}
      submitLabel={t("admin.journals.entry.submit")}
      submittingLabel={t("admin.journals.entry.submitting")}
      cancelLabel={t("admin.journals.entry.cancel")}
      closeLabel={t("admin.journals.entry.close")}
      panelClassName="max-w-4xl"
      footerContent={
        <p
          className={`border px-3 py-2 text-sm font-medium ${cashIn ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"}`}
        >
          {cashIn
            ? t("admin.journals.entry.customerPaymentNotice")
            : t("admin.journals.entry.vendorPaymentNotice")}
        </p>
      }
    >
      <div className="col-span-2">
        <ToggleSwitch
          id="journal-entry-cash-direction"
          checked={cashIn}
          onCheckedChange={selectCashDirection}
          label={
            cashIn
              ? t("admin.journals.entry.cashIn")
              : t("admin.journals.entry.cashOut")
          }
          labelClassName={
            cashIn
              ? "!text-emerald-700 dark:!text-emerald-400"
              : "!text-rose-700 dark:!text-rose-400"
          }
        />
      </div>
      <div className="col-span-2">
        <SelectField
          label={t("admin.journals.entry.partner")}
          options={partnerOptions}
          value={partnerId}
          onValueChange={selectPartner}
          tone="light"
        />
      </div>
      {partnerId && outstandingTransactions.length ? (
        <>
          <div className="col-span-2">
            <MultiSelectField
              className="w-full"
              label={transactionLabel}
              options={outstandingTransactions.map((transaction) => ({
                value: transaction.id,
                label: `${transaction.number} — ${transaction.balance.toLocaleString()} ${transaction.currencyCode}`,
              }))}
              value={selectedTransactionIds}
              onValueChange={selectTransactions}
              tone="light"
            />
          </div>
          <p className="col-span-2 order-35 text-sm font-semibold text-light-text dark:text-dark-text">
            {t("admin.journals.entry.totalSelected")}:{" "}
            {selectedCurrencies
              .map((currency) => {
                const total = selectedTransactions
                  .filter(
                    (transaction) => transaction.currencyCode === currency,
                  )
                  .reduce((sum, transaction) => sum + transaction.balance, 0);
                return `${total.toLocaleString()} ${currency}`;
              })
              .join(" · ")}
          </p>
        </>
      ) : partnerId && !isLoadingTransactions ? (
        <p className="col-span-2 text-sm text-light-muted dark:text-dark-muted">
          {t("admin.journals.entry.noOutstanding")}
        </p>
      ) : null}
      <InputField
        containerClassName="col-span-2 order-30"
        id="journal-entry-amount"
        label={t("admin.journals.entry.amount")}
        type="number"
        min={0}
        max={hasRequiredExchangeRates ? totalPaymentAmount : undefined}
        step="0.01"
        value={amount}
        onChange={(event) => setAmount(Number(event.target.value) || 0)}
        disabled={!settlementCurrency}
        tone="light"
      />
      <div className="col-span-2 order-10">
        <SelectField
          label={paymentCurrencyLabel}
          options={PAYMENT_CURRENCY_OPTIONS}
          value={paymentCurrencyCode}
          onValueChange={(value) => {
            setPaymentCurrencyCode(value as CurrencyCode);
            setPaymentExchangeRateInputs({});
            setAccountId("");
          }}
          disabled={!settlementCurrency}
          tone="light"
        />
      </div>
      {exchangeRateCurrencies.map((currency) => (
        <InputField
          key={currency}
          containerClassName="col-span-2 order-20"
          id={`journal-entry-payment-exchange-rate-${currency}`}
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
      ))}
      <div className="col-span-2 order-40">
        <SelectField
          label={accountLabel}
          options={accountOptions}
          value={accountId}
          onValueChange={setAccountId}
          disabled={!paymentCurrencyCode || !settlementCurrency}
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
        id="journal-entry-date"
        label={t("admin.journals.entry.date")}
        value={paymentDate}
        onChange={setPaymentDate}
        tone="light"
      />
      <TextareaField
        containerClassName="col-span-2 order-60"
        id="journal-entry-notes"
        label={t("admin.journals.entry.notes")}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        tone="light"
      />
    </FormModal>
  );
}

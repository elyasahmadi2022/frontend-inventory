"use client";

import { useQuery } from "@tanstack/react-query";
import { gooeyToast } from "goey-toast";
import { useEffect, useMemo, useState } from "react";
import { DatePickerField } from "@/components/common/date-picker-field";
import { FormModal } from "@/components/common/form-modal";
import { InputField } from "@/components/common/input-field";
import {
  SelectField,
  type SelectOption,
} from "@/components/common/select-field";
import { TextareaField } from "@/components/common/textarea-field";
import { ApiError } from "@/lib/api";
import { getLocalDateString } from "@/lib/date-format";
import { useI18n } from "@/lib/i18n";
import {
  useAdminAccountsQuery,
  useAdminFinancialSummaryQuery,
  useAdminPartnersQuery,
  useRecordAdminPartnerPaymentMutation,
} from "@/lib/query/hooks";
import type { CurrencyCode } from "@/services/accounts.service";
import { fetchConversionRate } from "@/services/currencies.service";

type Props = { open: boolean; onClose: () => void };
type PartnerType = "customer" | "vendor" | "";

const paymentCurrencyOptions: SelectOption[] = ["AFN", "USD", "PKR"].map(
  (currency) => ({ value: currency, label: currency }),
);

export function AdminJournalEntryModal({ open, onClose }: Props) {
  const { t } = useI18n();
  const accountsQuery = useAdminAccountsQuery({ isActive: true, limit: 100 });
  const partnersQuery = useAdminPartnersQuery({ isActive: true, limit: 100 });
  const summaryQuery = useAdminFinancialSummaryQuery();
  const mutation = useRecordAdminPartnerPaymentMutation();
  const [partnerType, setPartnerType] = useState<PartnerType>("");
  const [partnerId, setPartnerId] = useState("");
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode | "">("");
  const [paymentCurrencyCode, setPaymentCurrencyCode] = useState<
    CurrencyCode | ""
  >("");
  const [paymentExchangeRateInput, setPaymentExchangeRateInput] =
    useState("1");
  const paymentExchangeRate = Number(paymentExchangeRateInput);
  const [amount, setAmount] = useState(0);
  const [accountId, setAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(getLocalDateString);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      setPartnerType("");
      setPartnerId("");
      setCurrencyCode("");
      setPaymentCurrencyCode("");
      setPaymentExchangeRateInput("1");
      setAmount(0);
      setAccountId("");
      setPaymentDate(getLocalDateString());
      setNotes("");
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const direction = partnerType === "customer" ? "receive" : "pay";
  const partners = useMemo(
    () =>
      (partnersQuery.data?.items ?? []).filter((partner) =>
        partnerType === "customer"
          ? ["customer", "both"].includes(partner.type)
          : partnerType === "vendor"
            ? ["vendor", "both"].includes(partner.type)
            : false,
      ),
    [partnerType, partnersQuery.data?.items],
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
  const balanceRows = (() => {
    const rows =
      partnerType === "customer"
        ? (summaryQuery.data?.receivables.rows ?? [])
        : (summaryQuery.data?.payables.rows ?? []);
    return rows
      .filter((row) => row.partner?.id === partnerId && Number(row.balance) > 0)
      .map((row) => ({
        currencyCode: row.currencyCode,
        amount: Math.abs(Number(row.balance)),
      }));
  })();
  const selectedBalance = balanceRows.find(
    (row) => row.currencyCode === currencyCode,
  );
  const selectedAccount = (accountsQuery.data ?? []).find(
    (account) => account.id === accountId,
  );
  const accountCurrency = (selectedAccount?.currencyCode ?? paymentCurrencyCode) as
    | CurrencyCode
    | "";
  const accountOptions = useMemo<SelectOption[]>(
    () =>
      (accountsQuery.data ?? [])
        .filter(
          (account) =>
            account.isActive &&
            ["cash", "bank", "sarafi", "daskhil"].includes(account.type),
        )
        .filter(
          (account) =>
            !paymentCurrencyCode ||
            account.currencyCode === paymentCurrencyCode,
        )
        .map((account) => {
          const supportedCurrency = account.currencyCode ?? paymentCurrencyCode;
          return {
            value: account.id,
            label: `${account.code} - ${account.name} (${supportedCurrency})`,
            description: supportedCurrency,
          };
        }),
    [accountsQuery.data, paymentCurrencyCode],
  );
  const conversionQuery = useQuery({
    queryKey: [
      "journal-entry-conversion",
      currencyCode,
      paymentCurrencyCode,
      paymentDate,
    ],
    queryFn: () =>
      fetchConversionRate(
        paymentCurrencyCode as CurrencyCode,
        currencyCode as CurrencyCode,
        paymentDate,
      ),
    enabled: Boolean(
      currencyCode &&
        paymentCurrencyCode &&
        currencyCode !== paymentCurrencyCode,
    ),
  });

  useEffect(() => {
    if (conversionQuery.data?.rate) {
      setPaymentExchangeRateInput(String(conversionQuery.data.rate));
    }
  }, [conversionQuery.data?.rate]);

  const selectPartnerType = (value: string) => {
    setPartnerType(value as PartnerType);
    setPartnerId("");
    setCurrencyCode("");
    setPaymentCurrencyCode("");
    setPaymentExchangeRateInput("1");
    setAmount(0);
    setAccountId("");
  };
  const selectPartner = (value: string) => {
    setPartnerId(value);
    setAccountId("");
    setCurrencyCode("");
    setPaymentCurrencyCode("");
    setPaymentExchangeRateInput("1");
    setAmount(0);
  };
  const handleSubmit = async () => {
    if (!partnerType || !partnerId) {
      gooeyToast.error(t("admin.journals.entry.errorTitle"), {
        description: t("admin.journals.entry.validation.partner"),
      });
      return;
    }
    if (!selectedBalance || !(amount > 0)) {
      gooeyToast.error(t("admin.journals.entry.errorTitle"), {
        description: t("admin.journals.entry.validation.amount"),
      });
      return;
    }
    if (amount > selectedBalance.amount) {
      gooeyToast.error(t("admin.journals.entry.errorTitle"), {
        description: t("admin.journals.entry.validation.amountTooHigh"),
      });
      return;
    }
    if (
      currencyCode !== paymentCurrencyCode &&
      !(paymentExchangeRate > 0)
    ) {
      gooeyToast.error(t("admin.journals.entry.errorTitle"), {
        description: t("admin.journals.entry.validation.exchangeRate"),
      });
      return;
    }
    if (!accountId) {
      gooeyToast.error(t("admin.journals.entry.errorTitle"), {
        description: t("admin.journals.entry.validation.account"),
      });
      return;
    }
    try {
      await mutation.mutateAsync({
        partnerId,
        input: {
          direction,
          currencyCode: currencyCode as CurrencyCode,
          amount,
          accountId,
          paymentExchangeRate:
            currencyCode !== paymentCurrencyCode
              ? 1 / paymentExchangeRate
              : undefined,
          paymentDate,
          notes: notes.trim() || undefined,
        },
      });
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
  const accountLabel =
    direction === "receive"
      ? t("admin.journals.entry.receivingAccount")
      : t("admin.journals.entry.paymentAccount");
  return (
    <FormModal
      open={open}
      title={t("admin.journals.entry.title")}
      description={t("admin.journals.entry.description")}
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
      submitting={mutation.isPending}
      submitLabel={t("admin.journals.entry.submit")}
      submittingLabel={t("admin.journals.entry.submitting")}
      cancelLabel={t("admin.journals.entry.cancel")}
      closeLabel={t("admin.journals.entry.close")}
      panelClassName="max-w-4xl"
      footerContent={
        partnerType ? (
          <p
            className={`border px-3 py-2 text-sm font-medium ${
              partnerType === "customer"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
            }`}
          >
            {partnerType === "customer"
              ? t("admin.journals.entry.customerPaymentNotice")
              : t("admin.journals.entry.vendorPaymentNotice")}
          </p>
        ) : null
      }
    >
      <div className="col-span-2 md:col-span-1">
        <SelectField
          label={t("admin.journals.entry.partnerType")}
          options={[
            { value: "customer", label: t("admin.partners.type.customer") },
            { value: "vendor", label: t("admin.partners.type.vendor") },
          ]}
          value={partnerType}
          onValueChange={selectPartnerType}
          tone="light"
        />
      </div>
      <div className="col-span-2 md:col-span-1">
        <SelectField
          label={t("admin.journals.entry.partner")}
          options={partnerOptions}
          value={partnerId}
          onValueChange={selectPartner}
          disabled={!partnerType}
          tone="light"
        />
      </div>
      {partnerId && balanceRows.length ? (
        <div className="col-span-2 border border-light-border bg-light-bg px-3 py-2 dark:border-dark-border dark:bg-dark-bg">
          <p className="text-sm font-semibold text-light-text dark:text-dark-text">
            {t("admin.journals.entry.selectBalance")}
          </p>
          <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">
            {t("admin.journals.entry.selectBalanceDescription")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {balanceRows.map((row) => (
              <button
                key={row.currencyCode}
                type="button"
                onClick={() => {
                  setCurrencyCode(row.currencyCode);
                  setPaymentCurrencyCode(row.currencyCode);
                  setPaymentExchangeRateInput("1");
                  setAmount(row.amount);
                  setAccountId("");
                }}
                className={`border px-2 py-1 text-xs font-semibold ${currencyCode === row.currencyCode ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400" : "border-light-border text-light-text dark:border-dark-border dark:text-dark-text"}`}
              >
                {row.amount.toLocaleString()} {row.currencyCode}
              </button>
            ))}
          </div>
        </div>
      ) : partnerId && !summaryQuery.isLoading ? (
        <p className="col-span-2 text-sm text-light-muted dark:text-dark-muted">
          {t("admin.journals.entry.noOutstanding")}
        </p>
      ) : null}
      <InputField
        containerClassName="col-span-2 md:col-span-1"
        id="journal-entry-amount"
        label={t("admin.journals.entry.amount")}
        type="number"
        min={0}
        max={selectedBalance?.amount}
        step="0.01"
        value={amount}
        onChange={(event) => setAmount(Number(event.target.value) || 0)}
        disabled={!selectedBalance}
        tone="light"
      />
      <div className="col-span-2 md:col-span-1">
        <SelectField
          label={t("admin.journals.entry.currency")}
          options={paymentCurrencyOptions}
          value={paymentCurrencyCode}
          onValueChange={(value) => {
            setPaymentCurrencyCode(value as CurrencyCode);
            setPaymentExchangeRateInput("1");
            setAccountId("");
          }}
          disabled={!selectedBalance}
          tone="light"
        />
      </div>
      {currencyCode && paymentCurrencyCode && currencyCode !== paymentCurrencyCode ? (
        <InputField
          containerClassName="col-span-2 md:col-span-1"
          id="journal-entry-payment-exchange-rate"
          label={t("admin.currency.exchangeEquation", {
            source: paymentCurrencyCode,
            target: currencyCode,
          })}
          type="number"
          min={0.000001}
          step="0.000001"
          value={paymentExchangeRateInput}
          onChange={(event) => setPaymentExchangeRateInput(event.target.value)}
          tone="light"
        />
      ) : null}
      <div className="col-span-2">
        <SelectField
          label={accountLabel}
          options={accountOptions}
          value={accountId}
          onValueChange={setAccountId}
          disabled={!selectedBalance}
          tone="light"
        />
      </div>
      {currencyCode && paymentCurrencyCode && currencyCode !== paymentCurrencyCode ? (
        <p className="col-span-2 text-sm text-light-muted dark:text-dark-muted">
          {partnerType === "customer"
            ? t("admin.journals.entry.customerConvertedAmount", {
                converted: (amount / paymentExchangeRate).toLocaleString(),
                paymentCurrency: paymentCurrencyCode,
                amount: amount.toLocaleString(),
                balanceCurrency: currencyCode,
                rate: paymentExchangeRate.toLocaleString(),
              })
            : t("admin.journals.entry.vendorConvertedAmount", {
                converted: (amount / paymentExchangeRate).toLocaleString(),
                paymentCurrency: paymentCurrencyCode,
                amount: amount.toLocaleString(),
                balanceCurrency: currencyCode,
                rate: paymentExchangeRate.toLocaleString(),
              })}
        </p>
      ) : null}
      <DatePickerField
        containerClassName="col-span-2"
        id="journal-entry-date"
        label={t("admin.journals.entry.date")}
        value={paymentDate}
        onChange={setPaymentDate}
        tone="light"
      />
      <TextareaField
        containerClassName="col-span-2"
        id="journal-entry-notes"
        label={t("admin.journals.entry.notes")}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        tone="light"
      />
    </FormModal>
  );
}

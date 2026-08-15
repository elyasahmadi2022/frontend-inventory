"use client";

import { useQuery } from "@tanstack/react-query";
import { gooeyToast } from "goey-toast";
import { useEffect, useMemo, useState } from "react";
import {
  getAssetAccountBalance,
  renderAssetAccountOption,
} from "@/components/admin/shared/asset-account-options";
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

export function AdminJournalEntryModal({ open, onClose }: Props) {
  const { language, t } = useI18n();
  const accountsQuery = useAdminAccountsQuery({ isActive: true, limit: 100 });
  const partnersQuery = useAdminPartnersQuery({ isActive: true, limit: 100 });
  const summaryQuery = useAdminFinancialSummaryQuery();
  const mutation = useRecordAdminPartnerPaymentMutation();
  const [partnerType, setPartnerType] = useState<PartnerType>("");
  const [partnerId, setPartnerId] = useState("");
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode | "">("");
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
  const accountById = useMemo(
    () =>
      new Map(
        (accountsQuery.data ?? []).map((account) => [account.id, account]),
      ),
    [accountsQuery.data],
  );
  const selectedAccount = accountById.get(accountId);
  const accountCurrency = (selectedAccount?.currencyCode ?? currencyCode) as
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
        .map((account) => {
          const supportedCurrency = account.currencyCode ?? currencyCode;
          return {
            value: account.id,
            label: `${account.code} - ${account.name} (${getAssetAccountBalance(account, supportedCurrency)} ${supportedCurrency})`,
            description: supportedCurrency,
          };
        }),
    [accountsQuery.data, currencyCode],
  );
  const conversionQuery = useQuery({
    queryKey: [
      "journal-entry-conversion",
      currencyCode,
      accountCurrency,
      paymentDate,
    ],
    queryFn: () =>
      fetchConversionRate(
        currencyCode as CurrencyCode,
        accountCurrency as CurrencyCode,
        paymentDate,
      ),
    enabled: Boolean(
      currencyCode && accountCurrency && currencyCode !== accountCurrency,
    ),
  });

  const selectPartnerType = (value: string) => {
    setPartnerType(value as PartnerType);
    setPartnerId("");
    setCurrencyCode("");
    setAmount(0);
    setAccountId("");
  };
  const selectPartner = (value: string) => {
    setPartnerId(value);
    setAccountId("");
    const rows =
      partnerType === "customer"
        ? (summaryQuery.data?.receivables.rows ?? [])
        : (summaryQuery.data?.payables.rows ?? []);
    const first = rows.find(
      (row) => row.partner?.id === value && Number(row.balance) > 0,
    );
    setCurrencyCode(first?.currencyCode ?? "");
    setAmount(Math.abs(Number(first?.balance ?? 0)));
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
            {t("admin.journals.entry.outstanding")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {balanceRows.map((row) => (
              <button
                key={row.currencyCode}
                type="button"
                onClick={() => {
                  setCurrencyCode(row.currencyCode);
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
          options={balanceRows.map((row) => ({
            value: row.currencyCode,
            label: row.currencyCode,
          }))}
          value={currencyCode}
          onValueChange={(value) => {
            const balance = balanceRows.find(
              (row) => row.currencyCode === value,
            );
            setCurrencyCode(value as CurrencyCode);
            setAmount(balance?.amount ?? 0);
            setAccountId("");
          }}
          disabled={!selectedBalance}
          tone="light"
        />
      </div>
      <div className="col-span-2">
        <SelectField
          label={accountLabel}
          options={accountOptions}
          value={accountId}
          onValueChange={setAccountId}
          renderOption={(option) =>
            renderAssetAccountOption(
              option,
              accountById,
              accountCurrency || currencyCode,
              language,
            )
          }
          disabled={!selectedBalance}
          tone="light"
        />
      </div>
      {conversionQuery.data ? (
        <p className="col-span-2 text-sm text-light-muted dark:text-dark-muted">
          {t("admin.journals.entry.exchange", {
            amount: amount.toLocaleString(),
            currency: currencyCode,
            converted: (amount * conversionQuery.data.rate).toLocaleString(),
            accountCurrency,
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

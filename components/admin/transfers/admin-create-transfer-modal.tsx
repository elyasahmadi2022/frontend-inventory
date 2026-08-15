"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { gooeyToast } from "goey-toast";
import { FormDatePickerField, FormInputField, FormTextareaField } from "@/components/common";
import { CurrencyFlagIcon } from "@/components/common/currency-flag-icon";
import { formatAdminNumber } from "@/components/admin/shared/admin-money-display";
import { FormModal } from "@/components/common/form-modal";
import { SelectField, type SelectOption } from "@/components/common/select-field";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useCreateAdminTransferMutation } from "@/lib/query/hooks";
import {
  adminTransferDefaultValues,
  createAdminTransferSchema,
  type AdminTransferFormValues,
} from "@/lib/validation/admin-transfer-schemas";
import type { AccountRow } from "@/services/accounts.service";

type Props = {
  accounts: AccountRow[];
  open: boolean;
  onClose: () => void;
};

const transferableAccountTypes = ["cash", "bank", "sarafi", "daskhil"];

function availableAccountBalance(account: AccountRow) {
  return Number(account.balances?.find((item) => item.currencyCode === account.currencyCode)?.balance ?? 0);
}

function accountOption(account: AccountRow, language: string): SelectOption {
  const currencyCode = account.currencyCode ?? "-";
  const balance = Number(
    account.balances?.find((item) => item.currencyCode === account.currencyCode)?.balance ?? 0,
  );
  return {
    value: account.id,
    label: `${account.code}: ${account.name} (${formatAdminNumber(balance, language)} ${currencyCode})`,
    icon: <CurrencyFlagIcon currency={currencyCode} className="h-4 w-6" />,
    searchText: `${account.code} ${account.name} ${currencyCode}`,
  };
}

export function AdminCreateTransferModal({ accounts, open, onClose }: Props) {
  const { language, t } = useI18n();
  const createMutation = useCreateAdminTransferMutation();
  const schema = useMemo(() => createAdminTransferSchema(t), [t]);
  const form = useForm<AdminTransferFormValues>({
    resolver: zodResolver(schema) as Resolver<AdminTransferFormValues>,
    defaultValues: adminTransferDefaultValues,
    mode: "onTouched",
  });

  useEffect(() => {
    if (!open) return;
    form.reset(adminTransferDefaultValues);
  }, [form, open]);

  const fromAccountId = useWatch({ control: form.control, name: "fromAccountId" });
  const selectedFromAccount = useMemo(
    () => accounts.find((account) => account.id === fromAccountId),
    [accounts, fromAccountId],
  );
  const selectedCurrency = selectedFromAccount?.currencyCode;
  const toAccountId = useWatch({ control: form.control, name: "toAccountId" });
  const conversionRate = Number(useWatch({ control: form.control, name: "conversionRate" }) ?? 0);
  const selectedToAccount = useMemo(() => accounts.find((account) => account.id === toAccountId), [accounts, toAccountId]);
  const destinationCurrency = selectedToAccount?.currencyCode;
  const isCurrencyExchange = Boolean(selectedCurrency && destinationCurrency && selectedCurrency !== destinationCurrency);
  const sourceBalance = Number(
    selectedFromAccount?.balances?.find((balance) => balance.currencyCode === selectedCurrency)?.balance ?? 0,
  );

  const fromAccountOptions = useMemo<SelectOption[]>(
    () =>
      accounts
        .filter((account) => account.isActive && account.currencyCode && account.category === "asset" && account.normalBalance === "debit" && transferableAccountTypes.includes(account.type) && availableAccountBalance(account) > 0)
        .map((account) => accountOption(account, language)),
    [accounts, language],
  );
  const toAccountOptions = useMemo<SelectOption[]>(
    () =>
      accounts
        .filter(
          (account) =>
            account.isActive &&
            account.category === "asset" &&
            account.normalBalance === "debit" &&
            transferableAccountTypes.includes(account.type) &&
            account.id !== fromAccountId &&
            Boolean(selectedCurrency),
        )
        .map((account) => accountOption(account, language)),
    [accounts, fromAccountId, language, selectedCurrency],
  );

  useEffect(() => {
    if (!selectedCurrency) return;
    form.setValue("currencyCode", selectedCurrency as AdminTransferFormValues["currencyCode"]);
    form.setValue("exchangeRateToBase", 1);
    form.setValue("destinationCurrencyCode", undefined);
    form.setValue("destinationAmount", undefined);
    form.setValue("conversionRate", undefined);
    form.setValue("toAccountId", "");
  }, [accounts, form, selectedCurrency]);

  const submit = form.handleSubmit(async (values) => {
    if (values.amount > sourceBalance) {
      form.setError("amount", {
        message: t("admin.transfers.validation.exceedsBalance", {
          amount: formatAdminNumber(sourceBalance, language),
          currency: selectedCurrency ?? "",
        }),
      });
      return;
    }
    try {
      const exchange = values.destinationCurrencyCode !== values.currencyCode;
      const transfer = await createMutation.mutateAsync({
        ...values,
        destinationCurrencyCode: values.destinationCurrencyCode,
        destinationAmount: exchange ? values.amount * Number(values.conversionRate) : values.amount,
        conversionRate: exchange ? values.conversionRate : 1,
      });
      gooeyToast.success(t("admin.transfers.create.successTitle"), {
        description: t("admin.transfers.create.successDescription", {
          number: transfer.number,
        }),
      });
      onClose();
    } catch (error) {
      gooeyToast.error(t("admin.transfers.create.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.transfers.create.errorFallback"),
      });
    }
  });

  return (
    <FormModal
      open={open}
      title={t("admin.transfers.create.title")}
      description={t("admin.transfers.create.description")}
      submitLabel={t("admin.transfers.create.submit")}
      submittingLabel={t("admin.transfers.create.submitting")}
      cancelLabel={t("admin.transfers.create.cancel")}
      closeLabel={t("admin.transfers.create.close")}
      submitting={createMutation.isPending}
      onClose={() => {
        if (!createMutation.isPending) onClose();
      }}
      onSubmit={() => void submit()}
      panelClassName="max-w-4xl"
    >
      <FormDatePickerField control={form.control} name="transferDate" label={t("admin.transfers.column.date")} tone="light" />
      <Controller control={form.control} name="fromAccountId" render={({ field, fieldState }) => <SelectField label={t("admin.transfers.form.fromLabel")} description={t("admin.transfers.form.fromDescription")} options={fromAccountOptions} value={field.value} onValueChange={field.onChange} error={fieldState.error?.message} tone="light" searchable clearable={false} contentClassName="z-[1200]" />} />
      <Controller control={form.control} name="toAccountId" render={({ field, fieldState }) => <SelectField label={t("admin.transfers.form.toLabel")} description={selectedCurrency ? t("admin.transfers.form.receiverHelp") : t("admin.transfers.form.selectSourceFirst")} options={toAccountOptions} value={field.value} onValueChange={(value) => { field.onChange(value); const account = accounts.find((item) => item.id === value); form.setValue("destinationCurrencyCode", account?.currencyCode as AdminTransferFormValues["destinationCurrencyCode"]); form.setValue("conversionRate", account?.currencyCode === selectedCurrency ? 1 : undefined); form.setValue("destinationAmount", undefined); }} error={fieldState.error?.message} tone="light" searchable clearable={false} disabled={!selectedCurrency} contentClassName="z-[1200]" />} />
      {isCurrencyExchange ? <FormInputField control={form.control} name="conversionRate" type="number" min={0.00000001} step="any" label={t("admin.transfers.form.directRate")} description={t("admin.transfers.form.exchangeEquation", { source: selectedCurrency ?? "", target: destinationCurrency ?? "", rate: conversionRate > 0 ? formatAdminNumber(conversionRate, language) : "—" })} tone="light" /> : null}
      <FormInputField control={form.control} name="amount" type="number" min={0.01} max={Math.max(sourceBalance, 0)} step="0.01" label={t("admin.transfers.form.amountLabel")} description={selectedCurrency ? t("admin.transfers.form.amountRange", { amount: formatAdminNumber(sourceBalance, language), currency: selectedCurrency }) : t("admin.transfers.form.selectSourceForBalance")} tone="light" />
      <FormTextareaField control={form.control} name="notes" label={t("admin.transfers.form.descriptionLabel")} tone="light" rows={3} containerClassName="sm:col-span-2" />
    </FormModal>
  );
}

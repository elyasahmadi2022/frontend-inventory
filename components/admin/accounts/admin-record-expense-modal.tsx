"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ReceiptText } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { z } from "zod";
import { gooeyToast } from "goey-toast";
import { FormDatePickerField, FormInputField } from "@/components/common";
import { CurrencyFlagIcon } from "@/components/common/currency-flag-icon";
import { FormModal } from "@/components/common/form-modal";
import {
  SelectField,
  type SelectOption,
} from "@/components/common/select-field";
import {
  buildAssetAccountOptions,
  renderAssetAccountOption,
} from "@/components/admin/shared/asset-account-options";
import { ApiError } from "@/lib/api";
import { getLocalDateString } from "@/lib/date-format";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { useRecordAdminExpenseMutation } from "@/lib/query/hooks";
import type { AccountRow, CurrencyCode } from "@/services/accounts.service";
import type { CurrencyRow } from "@/services/currencies.service";

type Props = {
  accounts: AccountRow[];
  currencies: CurrencyRow[];
  open: boolean;
  onClose: () => void;
};

type T = (
  key: TranslationKey,
  values?: Record<string, string | number>,
) => string;

function createExpenseSchema(t: T) {
  return z.object({
    expenseCategoryId: z
      .string()
      .min(1, t("admin.accounts.expense.validation.categoryRequired")),
    expenseDate: z
      .string()
      .min(1, t("admin.accounts.expense.validation.dateRequired")),
    description: z
      .string()
      .trim()
      .min(2, t("admin.accounts.expense.validation.descriptionRequired")),
    expenseAccountId: z
      .string()
      .min(1, t("admin.accounts.expense.validation.expenseAccountRequired")),
    paymentAccountId: z
      .string()
      .min(1, t("admin.accounts.expense.validation.paymentAccountRequired")),
    currencyCode: z.enum(["AFN", "USD", "PKR"], {
      message: t("admin.accounts.expense.validation.currencyRequired"),
    }),
    amount: z.coerce
      .number()
      .positive(t("admin.accounts.expense.validation.amountPositive")),
  });
}

type AdminExpenseFormValues = z.infer<ReturnType<typeof createExpenseSchema>>;

const today = getLocalDateString();

export function AdminRecordExpenseModal({
  accounts,
  currencies,
  open,
  onClose,
}: Props) {
  const { language, t } = useI18n();
  const createMutation = useRecordAdminExpenseMutation();
  const schema = useMemo(() => createExpenseSchema(t), [t]);
  const activeCurrencies = useMemo(
    () => currencies.filter((currency) => currency.isActive),
    [currencies],
  );
  const currencyOptions = useMemo<SelectOption[]>(
    () =>
      activeCurrencies.map((currency) => ({
        value: currency.code,
        label: currency.code,
        description: currency.name,
        icon: (
          <CurrencyFlagIcon
            currency={currency.code}
            className="h-4 w-6 rounded-[2px]"
          />
        ),
      })),
    [activeCurrencies],
  );
  const form = useForm<AdminExpenseFormValues>({
    resolver: zodResolver(schema) as Resolver<AdminExpenseFormValues>,
    defaultValues: {
      expenseCategoryId: "",
      expenseDate: today,
      description: "",
      expenseAccountId: "",
      paymentAccountId: "",
      currencyCode: (activeCurrencies[0]?.code ?? "AFN") as CurrencyCode,
      amount: 0,
    },
    mode: "onTouched",
  });

  const expenseCategoryId = useWatch({
    control: form.control,
    name: "expenseCategoryId",
  });
  const currencyCode = useWatch({
    control: form.control,
    name: "currencyCode",
  });
  const expenseAccountId = useWatch({
    control: form.control,
    name: "expenseAccountId",
  });
  const accountById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );

  useEffect(() => {
    if (!open) return;
    form.reset({
      expenseCategoryId: "",
      expenseDate: today,
      description: "",
      expenseAccountId: "",
      paymentAccountId: "",
      currencyCode: (activeCurrencies[0]?.code ?? "AFN") as CurrencyCode,
      amount: 0,
    });
  }, [activeCurrencies, form, open]);

  const activeExpenseAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.isActive &&
          account.category === "expense" &&
          account.currencyCode === currencyCode,
      ),
    [accounts, currencyCode],
  );

  const childExpenseParentIds = useMemo(
    () =>
      new Set(
        activeExpenseAccounts
          .map((account) => account.parentId)
          .filter((parentId): parentId is string => Boolean(parentId)),
      ),
    [activeExpenseAccounts],
  );

  const expenseCategoryOptions = useMemo<SelectOption[]>(
    () =>
      activeExpenseAccounts
        .filter(
          (account) =>
            account.isControlAccount || childExpenseParentIds.has(account.id),
        )
        .map((account) => ({
          value: account.id,
          label: `${account.code} - ${account.name}`,
          description: account.currencyCode ?? currencyCode,
        })),
    [activeExpenseAccounts, childExpenseParentIds, currencyCode],
  );

  const expenseAccountOptions = useMemo<SelectOption[]>(() => {
    const directChildren = activeExpenseAccounts.filter(
      (account) =>
        account.parentId === expenseCategoryId && !account.isControlAccount,
    );
    const selectedCategory = activeExpenseAccounts.find(
      (account) => account.id === expenseCategoryId,
    );
    const scopedAccounts =
      directChildren.length > 0
        ? directChildren
        : selectedCategory
          ? [selectedCategory]
          : [];

    return scopedAccounts.map((account) => ({
      value: account.id,
      label: `${account.code} - ${account.name}`,
      description: account.currencyCode ?? currencyCode,
    }));
  }, [activeExpenseAccounts, currencyCode, expenseCategoryId]);

  const paymentAccountOptions = useMemo(
    () => buildAssetAccountOptions(accounts, currencyCode, language),
    [accounts, currencyCode, language],
  );

  useEffect(() => {
    if (!expenseCategoryId) return;
    const currentExpenseAccountId = form.getValues("expenseAccountId");
    const currentStillValid = expenseAccountOptions.some(
      (option) => option.value === currentExpenseAccountId,
    );
    if (!currentStillValid) {
      form.setValue("expenseAccountId", expenseAccountOptions[0]?.value ?? "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [expenseAccountOptions, expenseCategoryId, form]);

  useEffect(() => {
    const currentPaymentAccountId = form.getValues("paymentAccountId");
    const currentStillValid = paymentAccountOptions.some(
      (option) => option.value === currentPaymentAccountId,
    );
    if (!currentStillValid && paymentAccountOptions.length === 1) {
      form.setValue("paymentAccountId", paymentAccountOptions[0].value, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [form, paymentAccountOptions]);

  useEffect(() => {
    const expenseAccount = accountById.get(expenseAccountId);
    const currentDescription = form.getValues("description").trim();
    if (expenseAccount && !currentDescription) {
      form.setValue("description", expenseAccount.name, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [accountById, expenseAccountId, form]);

  const submit = form.handleSubmit(async (values) => {
    try {
      const payment = await createMutation.mutateAsync({
        expenseDate: values.expenseDate,
        description: values.description,
        expenseAccountId: values.expenseAccountId,
        paymentAccountId: values.paymentAccountId,
        currencyCode: values.currencyCode,
        amount: values.amount,
      });
      gooeyToast.success(t("admin.accounts.expense.successTitle"), {
        description: t("admin.accounts.expense.successDescription", {
          number: payment.number,
        }),
      });
      onClose();
    } catch (error) {
      gooeyToast.error(t("admin.accounts.expense.errorTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.accounts.expense.errorFallback"),
      });
    }
  });

  return (
    <FormModal
      open={open}
      title={t("admin.accounts.expense.title")}
      description={t("admin.accounts.expense.description")}
      submitLabel={t("admin.accounts.expense.submit")}
      submittingLabel={t("admin.accounts.expense.submitting")}
      cancelLabel={t("admin.accounts.expense.cancel")}
      closeLabel={t("admin.accounts.expense.close")}
      submitting={createMutation.isPending}
      onClose={() => {
        if (!createMutation.isPending) onClose();
      }}
      onSubmit={() => void submit()}
      panelClassName="max-w-4xl"
    >
      <FormDatePickerField
        control={form.control}
        name="expenseDate"
        label={t("admin.accounts.expense.date")}
        tone="light"
      />
      <Controller
        control={form.control}
        name="currencyCode"
        render={({ field, fieldState }) => (
          <SelectField
            label={t("admin.accounts.expense.currency")}
            options={currencyOptions}
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              form.setValue("expenseCategoryId", "");
              form.setValue("expenseAccountId", "");
              form.setValue("paymentAccountId", "");
              form.setValue("description", "");
            }}
            error={fieldState.error?.message}
            tone="light"
            clearable={false}
          />
        )}
      />
      <Controller
        control={form.control}
        name="expenseCategoryId"
        render={({ field, fieldState }) => (
          <SelectField
            label={t("admin.accounts.expense.category")}
            options={expenseCategoryOptions}
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              form.setValue("expenseAccountId", "");
              form.setValue("description", "");
            }}
            error={fieldState.error?.message}
            tone="light"
            searchable
            clearable={false}
            contentClassName="z-[1200]"
          />
        )}
      />
      <Controller
        control={form.control}
        name="expenseAccountId"
        render={({ field, fieldState }) => (
          <SelectField
            label={t("admin.accounts.expense.expenseAccount")}
            options={expenseAccountOptions}
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              const selectedAccount = accountById.get(value);
              if (selectedAccount) {
                form.setValue("description", selectedAccount.name, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
            }}
            error={fieldState.error?.message}
            tone="light"
            searchable
            clearable={false}
            contentClassName="z-[1200]"
          />
        )}
      />
      <FormInputField
        control={form.control}
        name="amount"
        type="number"
        min={0}
        step="0.01"
        label={t("admin.accounts.expense.amount")}
        tone="light"
      />
      <Controller
        control={form.control}
        name="paymentAccountId"
        render={({ field, fieldState }) => (
          <SelectField
            label={t("admin.accounts.expense.paymentAccount")}
            options={paymentAccountOptions}
            value={field.value}
            onValueChange={field.onChange}
            error={fieldState.error?.message}
            tone="light"
            searchable
            clearable={false}
            contentClassName="z-[1200]"
            renderOption={(option) =>
              renderAssetAccountOption(
                option,
                accountById,
                currencyCode,
                language,
              )
            }
          />
        )}
      />
      <FormInputField
        control={form.control}
        name="description"
        label={t("admin.accounts.expense.descriptionLabel")}
        description={t("admin.accounts.expense.descriptionHelp")}
        startIcon={<ReceiptText className="size-4" />}
        tone="light"
        containerClassName="sm:col-span-2"
      />
    </FormModal>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Landmark } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { gooeyToast } from "goey-toast";
import { FormInputField, ToggleSwitch } from "@/components/common";
import { FormModal } from "@/components/common/form-modal";
import { SelectField, type SelectOption } from "@/components/common/select-field";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  useCreateAdminAccountMutation,
  useUpdateAdminAccountMutation,
} from "@/lib/query/hooks";
import {
  adminAccountDefaultValues,
  createAdminAccountSchema,
  type AdminAccountFormValues,
} from "@/lib/validation/admin-account-schemas";
import type { AccountCategory, AccountRow, AccountType } from "@/services/accounts.service";
import type { SaveAccountInput } from "@/services/accounts.service";

type Props = {
  accounts: AccountRow[];
  account?: AccountRow | null;
  open: boolean;
  onClose: () => void;
};

const currencyOptions: SelectOption[] = [
  { value: "AFN", label: "AFN" },
  { value: "USD", label: "USD" },
  { value: "PKR", label: "PKR" },
];

const categoryTypes: Record<AccountCategory, AccountType[]> = {
  asset: ["cash", "bank", "sarafi", "daskhil", "accounts_receivable", "inventory", "other"],
  liability: ["accounts_payable", "liability", "other"],
  equity: ["equity"],
  revenue: ["sales_revenue", "exchange_gain", "other"],
  expense: ["cost_of_goods_sold", "purchase", "expense", "exchange_loss", "other"],
};

const normalBalanceByCategory: Record<AccountCategory, "debit" | "credit"> = {
  asset: "debit",
  liability: "credit",
  equity: "credit",
  revenue: "credit",
  expense: "debit",
};

function valuesFromAccount(account?: AccountRow | null): AdminAccountFormValues {
  if (!account) return adminAccountDefaultValues;
  return {
    code: account.code ?? "",
    name: account.name ?? "",
    category: account.category,
    type: account.type,
    normalBalance: account.normalBalance,
    currencyCode: account.currencyCode ?? "AFN",
    parentId: account.parentId ?? "",
    isControlAccount: Boolean(account.isControlAccount),
    isActive: account.isActive,
  };
}

export function AdminAccountModal({ accounts, account, open, onClose }: Props) {
  const { t } = useI18n();
  const createMutation = useCreateAdminAccountMutation();
  const updateMutation = useUpdateAdminAccountMutation();
  const schema = useMemo(() => createAdminAccountSchema(t), [t]);
  const editing = Boolean(account);
  const submitting = createMutation.isPending || updateMutation.isPending;
  const form = useForm<AdminAccountFormValues>({
    resolver: zodResolver(schema) as Resolver<AdminAccountFormValues>,
    defaultValues: adminAccountDefaultValues,
    mode: "onTouched",
  });
  const category = form.watch("category");

  useEffect(() => {
    if (!open) return;
    form.reset(valuesFromAccount(account));
  }, [account, form, open]);

  useEffect(() => {
    form.setValue("normalBalance", normalBalanceByCategory[category], {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [category, form]);

  const categoryOptions = useMemo<SelectOption[]>(
    () => [
      { value: "asset", label: t("admin.accounts.category.asset") },
      { value: "liability", label: t("admin.accounts.category.liability") },
      { value: "equity", label: t("admin.accounts.category.equity") },
      { value: "revenue", label: t("admin.accounts.category.revenue") },
      { value: "expense", label: t("admin.accounts.category.expense") },
    ],
    [t],
  );
  const typeOptions = useMemo<SelectOption[]>(
    () =>
      categoryTypes[category].map((type) => ({
        value: type,
        label: t(`admin.accounts.type.${type}` as never),
      })),
    [category, t],
  );
  const parentOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: t("admin.accounts.form.noParent") },
      ...accounts
        .filter((item) => item.id !== account?.id && item.category === category)
        .map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` })),
    ],
    [account?.id, accounts, category, t],
  );

  const submit = form.handleSubmit(async (values) => {
    try {
      const input: SaveAccountInput = {
        ...values,
        currencyCode: values.currencyCode as SaveAccountInput["currencyCode"],
        parentId: values.parentId || undefined,
        isActive: editing ? account!.isActive : true,
      };
      const saved = editing
        ? await updateMutation.mutateAsync({ id: account!.id, input })
        : await createMutation.mutateAsync(input);
      gooeyToast.success(
        editing
          ? t("admin.accounts.form.updatedTitle")
          : t("admin.accounts.form.createdTitle"),
        {
          description: t("admin.accounts.form.savedDescription", {
            name: saved.name,
          }),
        },
      );
      onClose();
    } catch (error) {
      gooeyToast.error(t("admin.accounts.form.saveFailedTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.accounts.form.saveFailedFallback"),
      });
    }
  });

  return (
    <FormModal
      open={open}
      title={editing ? t("admin.accounts.form.editTitle", { name: account?.name ?? "" }) : t("admin.accounts.form.addTitle")}
      description={t("admin.accounts.form.description")}
      submitLabel={editing ? t("admin.accounts.form.update") : t("admin.accounts.form.create")}
      submittingLabel={t("admin.accounts.form.saving")}
      cancelLabel={t("admin.accounts.form.cancel")}
      closeLabel={t("admin.accounts.form.close")}
      submitting={submitting}
      onClose={() => {
        if (!submitting) onClose();
      }}
      onSubmit={() => void submit()}
      panelClassName="max-w-4xl"
    >
      <FormInputField control={form.control} name="name" label={t("admin.accounts.column.name")} startIcon={<Landmark className="size-4" />} tone="light" containerClassName="sm:col-span-2" />
      <Controller control={form.control} name="category" render={({ field }) => <SelectField label={t("admin.accounts.column.category")} options={categoryOptions} value={field.value} onValueChange={(value) => { field.onChange(value); form.setValue("type", categoryTypes[value as AccountCategory][0]); form.setValue("normalBalance", normalBalanceByCategory[value as AccountCategory]); }} tone="light" clearable={false} />} />
      <Controller control={form.control} name="type" render={({ field }) => <SelectField label={t("admin.accounts.column.type")} options={typeOptions} value={field.value} onValueChange={field.onChange} tone="light" clearable={false} />} />
      <Controller
        control={form.control}
        name="normalBalance"
        render={({ field }) => (
          <SelectField
            label={`${t("admin.accounts.column.normalBalance")} [${t("admin.accounts.form.autoSelected")}]`}
            description={t(`admin.accounts.form.normalBalanceHint.${category}` as never)}
            options={[
              { value: "debit", label: t("admin.accounts.balance.debit") },
              { value: "credit", label: t("admin.accounts.balance.credit") },
            ]}
            value={field.value}
            onValueChange={field.onChange}
            tone="light"
            clearable={false}
            disabled
          />
        )}
      />
      <Controller control={form.control} name="currencyCode" render={({ field }) => <SelectField label={t("admin.accounts.column.currency")} options={currencyOptions} value={field.value ?? "AFN"} onValueChange={field.onChange} tone="light" clearable={false} />} />
      <div className="sm:col-span-2">
        <Controller
          control={form.control}
          name="parentId"
          render={({ field }) => (
            <SelectField
              label={t("admin.accounts.column.parent")}
              options={parentOptions}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              tone="light"
              searchable
              clearable={false}
            />
          )}
        />
      </div>
      <Controller
        control={form.control}
        name="isControlAccount"
        render={({ field }) => (
          <div className="sm:col-span-2 border border-light-border px-3 py-2 dark:border-dark-border">
            <ToggleSwitch
              id="admin-account-control"
              checked={field.value}
              onCheckedChange={field.onChange}
              label={t("admin.accounts.column.control")}
            />
            <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">
              {t("admin.accounts.form.controlHint")}
            </p>
          </div>
        )}
      />
    </FormModal>
  );
}

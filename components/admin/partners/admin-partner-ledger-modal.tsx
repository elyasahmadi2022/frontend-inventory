"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { gooeyToast } from "goey-toast";
import { FormModal } from "@/components/common/form-modal";
import { SelectField, type SelectOption } from "@/components/common/select-field";
import { ToggleSwitch } from "@/components/common/toggle-switch";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useCreateAdminPartnerLedgerAccountMutation } from "@/lib/query/hooks";
import {
  adminPartnerLedgerDefaultValues,
  createAdminPartnerLedgerSchema,
  type AdminPartnerLedgerFormValues,
} from "@/lib/validation/admin-partner-schemas";
import type { AccountRow } from "@/services/accounts.service";
import type { PartnerRow } from "@/services/partners.service";

type Props = {
  accounts: AccountRow[];
  open: boolean;
  partner: PartnerRow | null;
  onClose: () => void;
};

const currencyOptions: SelectOption[] = [
  { value: "AFN", label: "AFN" },
  { value: "USD", label: "USD" },
  { value: "PKR", label: "PKR" },
];

export function AdminPartnerLedgerModal({
  accounts,
  open,
  partner,
  onClose,
}: Props) {
  const { t } = useI18n();
  const createMutation = useCreateAdminPartnerLedgerAccountMutation();
  const schema = useMemo(() => createAdminPartnerLedgerSchema(t), [t]);
  const form = useForm<AdminPartnerLedgerFormValues>({
    resolver: zodResolver(schema) as Resolver<AdminPartnerLedgerFormValues>,
    defaultValues: adminPartnerLedgerDefaultValues,
    mode: "onTouched",
  });

  useEffect(() => {
    if (!open) return;
    form.reset(adminPartnerLedgerDefaultValues);
  }, [form, open]);

  const ledgerTypeOptions = useMemo<SelectOption[]>(
    () => [
      { value: "receivable", label: t("admin.partners.ledger.receivable") },
      { value: "payable", label: t("admin.partners.ledger.payable") },
      { value: "advance_received", label: t("admin.partners.ledger.advanceReceived") },
      { value: "advance_paid", label: t("admin.partners.ledger.advancePaid") },
      { value: "deposit", label: t("admin.partners.ledger.deposit") },
    ],
    [t],
  );
  const accountOptions = useMemo<SelectOption[]>(
    () =>
      accounts.map((account) => ({
        value: account.id,
        label: `${account.code} - ${account.name}`,
        description: account.type,
      })),
    [accounts],
  );

  const submit = form.handleSubmit(async (values) => {
    if (!partner) return;
    try {
      await createMutation.mutateAsync({ partnerId: partner.id, input: values });
      gooeyToast.success(t("admin.partners.ledger.createdTitle"), {
        description: t("admin.partners.ledger.savedDescription", {
          name: partner.name,
        }),
      });
      onClose();
    } catch (error) {
      gooeyToast.error(t("admin.partners.ledger.saveFailedTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.partners.ledger.saveFailedFallback"),
      });
    }
  });

  return (
    <FormModal
      open={open}
      title={t("admin.partners.ledger.addTitle", {
        name: partner?.name ?? "",
      })}
      description={t("admin.partners.ledger.description")}
      submitLabel={t("admin.partners.ledger.create")}
      submittingLabel={t("admin.partners.form.saving")}
      cancelLabel={t("admin.partners.form.cancel")}
      closeLabel={t("admin.partners.form.close")}
      submitting={createMutation.isPending}
      onClose={() => {
        if (!createMutation.isPending) onClose();
      }}
      onSubmit={() => void submit()}
    >
      <Controller control={form.control} name="accountId" render={({ field, fieldState }) => <SelectField label={t("admin.partners.ledger.account")} options={accountOptions} value={field.value} onValueChange={field.onChange} error={fieldState.error?.message} tone="light" searchable clearable={false} contentClassName="z-[1200]" />} />
      <Controller control={form.control} name="type" render={({ field }) => <SelectField label={t("admin.partners.ledger.type")} options={ledgerTypeOptions} value={field.value} onValueChange={field.onChange} tone="light" clearable={false} />} />
      <Controller control={form.control} name="currencyCode" render={({ field }) => <SelectField label={t("admin.partners.ledger.currency")} options={currencyOptions} value={field.value} onValueChange={field.onChange} tone="light" clearable={false} />} />
      <Controller
        control={form.control}
        name="isDefault"
        render={({ field }) => (
          <div className="flex min-h-12 items-center border border-light-border px-3 dark:border-dark-border">
            <ToggleSwitch id="admin-partner-ledger-default" checked={field.value} onCheckedChange={field.onChange} label={t("admin.partners.ledger.default")} />
          </div>
        )}
      />
    </FormModal>
  );
}

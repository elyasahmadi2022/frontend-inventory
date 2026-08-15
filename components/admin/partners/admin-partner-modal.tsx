"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Phone } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { gooeyToast } from "goey-toast";
import { FormInputField, FormTextareaField } from "@/components/common";
import { FormModal } from "@/components/common/form-modal";
import {
  SelectField,
  type SelectOption,
} from "@/components/common/select-field";
import { ToggleSwitch } from "@/components/common/toggle-switch";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  useCreateAdminPartnerMutation,
  useUpdateAdminPartnerMutation,
} from "@/lib/query/hooks";
import {
  adminPartnerDefaultValues,
  createAdminPartnerSchema,
  type AdminPartnerFormValues,
} from "@/lib/validation/admin-partner-schemas";
import type {
  PartnerRow,
  PartnerType,
  SavePartnerInput,
  UpdatePartnerInput,
} from "@/services/partners.service";

type Props = {
  open: boolean;
  partner?: PartnerRow | null;
  onClose: () => void;
};

function valuesFromPartner(
  partner?: PartnerRow | null,
): AdminPartnerFormValues {
  if (!partner) return adminPartnerDefaultValues;
  return {
    code: partner.code ?? "",
    name: partner.name ?? "",
    type: partner.type,
    phone: partner.phone ?? "",
    address: partner.address ?? "",
    receivableAccountId: partner.receivableAccountId ?? "",
    payableAccountId: partner.payableAccountId ?? "",
    isActive: partner.isActive,
  };
}

function canHaveReceivable(type: PartnerType) {
  return ["customer", "both", "sarafi", "staff"].includes(type);
}

function canHavePayable(type: PartnerType) {
  return ["vendor", "both", "sarafi", "staff"].includes(type);
}

export function AdminPartnerModal({ open, partner, onClose }: Props) {
  const { t } = useI18n();
  const createMutation = useCreateAdminPartnerMutation();
  const updateMutation = useUpdateAdminPartnerMutation();
  const schema = useMemo(() => createAdminPartnerSchema(t), [t]);
  const editing = Boolean(partner);
  const submitting = createMutation.isPending || updateMutation.isPending;
  const form = useForm<AdminPartnerFormValues>({
    resolver: zodResolver(schema) as Resolver<AdminPartnerFormValues>,
    defaultValues: adminPartnerDefaultValues,
    mode: "onTouched",
  });
  const type = form.watch("type");

  useEffect(() => {
    if (!open) return;
    form.reset(valuesFromPartner(partner));
  }, [form, open, partner]);

  const typeOptions = useMemo<SelectOption[]>(
    () => [
      { value: "customer", label: t("admin.partners.type.customer") },
      { value: "vendor", label: t("admin.partners.type.vendor") },
      { value: "both", label: t("admin.partners.type.both") },
      { value: "sarafi", label: t("admin.partners.type.sarafi") },
      { value: "staff", label: t("admin.partners.type.staff") },
    ],
    [t],
  );
  const submit = form.handleSubmit(async (values) => {
    try {
      const input: SavePartnerInput = {
        name: values.name,
        type: values.type,
        phone: values.phone,
        address: values.address,
        receivableAccountId: undefined,
        payableAccountId: undefined,
        isActive: values.isActive,
      };
      const saved = editing
        ? await updateMutation.mutateAsync({
            id: partner!.id,
            input: {
              name: input.name,
              type: input.type,
              phone: input.phone,
              address: input.address,
              receivableAccountId: input.receivableAccountId,
              payableAccountId: input.payableAccountId,
              isActive: input.isActive,
            } satisfies UpdatePartnerInput,
          })
        : await createMutation.mutateAsync(input);
      gooeyToast.success(
        editing
          ? t("admin.partners.form.updatedTitle")
          : t("admin.partners.form.createdTitle"),
        {
          description: t("admin.partners.form.savedDescription", {
            name: saved.name,
          }),
        },
      );
      onClose();
    } catch (error) {
      gooeyToast.error(t("admin.partners.form.saveFailedTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.partners.form.saveFailedFallback"),
      });
    }
  });

  return (
    <FormModal
      open={open}
      title={
        editing
          ? t("admin.partners.form.editTitle", { name: partner?.name ?? "" })
          : t("admin.partners.form.addTitle")
      }
      description={t("admin.partners.form.description")}
      submitLabel={
        editing
          ? t("admin.partners.form.update")
          : t("admin.partners.form.create")
      }
      submittingLabel={t("admin.partners.form.saving")}
      cancelLabel={t("admin.partners.form.cancel")}
      closeLabel={t("admin.partners.form.close")}
      submitting={submitting}
      onClose={() => {
        if (!submitting) onClose();
      }}
      onSubmit={() => void submit()}
      panelClassName="max-w-4xl"
    >
      <FormInputField
        control={form.control}
        name="name"
        label={t("admin.partners.column.name")}
        placeholder={t("admin.partners.form.namePlaceholder")}
        startIcon={<Building2 className="size-4" />}
        tone="light"
        containerClassName="sm:col-span-2"
      />
      <Controller
        control={form.control}
        name="type"
        render={({ field }) => (
          <SelectField
            label={t("admin.partners.column.type")}
            placeholder={t("admin.partners.form.typePlaceholder")}
            options={typeOptions}
            value={field.value}
            onValueChange={field.onChange}
            tone="light"
            clearable={false}
          />
        )}
      />
      <FormInputField
        control={form.control}
        name="phone"
        label={t("admin.partners.column.phone")}
        placeholder={t("admin.partners.form.phonePlaceholder")}
        startIcon={<Phone className="size-4" />}
        tone="light"
      />
      <Controller
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <div className="flex min-h-12 items-center border border-light-border px-3 dark:border-dark-border">
            <ToggleSwitch
              id="admin-partner-active"
              checked={field.value}
              onCheckedChange={field.onChange}
              label={t("admin.partners.status.active")}
            />
          </div>
        )}
      />
      <FormTextareaField
        control={form.control}
        name="address"
        label={t("admin.partners.column.address")}
        placeholder={t("admin.partners.form.addressPlaceholder")}
        tone="light"
        rows={3}
        containerClassName="sm:col-span-2"
      />
      <div className="sm:col-span-2 border-t border-light-border pt-3 text-xs leading-5 text-light-muted dark:border-dark-border dark:text-dark-muted">
        <div
          className={
            canHaveReceivable(type)
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-rose-700 dark:text-rose-300"
          }
        >
          {canHaveReceivable(type)
            ? t("admin.partners.form.receivableAuto")
            : t("admin.partners.form.receivableUnused")}
        </div>
        <div
          className={
            canHavePayable(type)
              ? "mt-1 text-emerald-700 dark:text-emerald-300"
              : "mt-1 text-rose-700 dark:text-rose-300"
          }
        >
          {canHavePayable(type)
            ? t("admin.partners.form.payableAuto")
            : t("admin.partners.form.payableUnused")}
        </div>
      </div>
    </FormModal>
  );
}

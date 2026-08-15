"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Barcode, Boxes, DollarSign, Package, Tag } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { gooeyToast } from "goey-toast";
import { FormInputField, FormTextareaField } from "@/components/common";
import { FormModal } from "@/components/common/form-modal";
import { SelectField, type SelectOption } from "@/components/common/select-field";
import { ToggleSwitch } from "@/components/common/toggle-switch";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  useCreateAdminProductMutation,
  useUpdateAdminProductMutation,
} from "@/lib/query/hooks";
import {
  adminProductDefaultValues,
  createAdminProductSchema,
  type AdminProductFormValues,
} from "@/lib/validation/admin-product-schemas";
import type {
  ProductCategoryRow,
  ProductRow,
  SaveProductInput,
  UnitRow,
} from "@/services/products.service";

type AdminProductModalProps = {
  categories: ProductCategoryRow[];
  open: boolean;
  product?: ProductRow | null;
  units: UnitRow[];
  onClose: () => void;
};

const currencyOptions: SelectOption[] = [
  { value: "AFN", label: "AFN" },
  { value: "USD", label: "USD" },
  { value: "PKR", label: "PKR" },
];

function toNumber(value: string | number | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function valuesFromProduct(product?: ProductRow | null): AdminProductFormValues {
  if (!product) return adminProductDefaultValues;
  return {
    sku: product.sku ?? "",
    barcode: product.barcode ?? "",
    name: product.name ?? "",
    description: product.description ?? "",
    categoryId: product.categoryId ?? "",
    baseUnitId: product.baseUnitId ?? product.baseUnit?.id ?? "",
    preferredPurchaseCurrency: product.preferredPurchaseCurrency ?? "USD",
    preferredSaleCurrency: product.preferredSaleCurrency ?? "AFN",
    standardCost: toNumber(product.standardCost),
    defaultSalePrice: toNumber(product.defaultSalePrice),
    reorderLevel: toNumber(product.reorderLevel),
    isActive: product.isActive ?? true,
  };
}

export function AdminProductModal({
  categories,
  open,
  product,
  units,
  onClose,
}: AdminProductModalProps) {
  const { t } = useI18n();
  const createMutation = useCreateAdminProductMutation();
  const updateMutation = useUpdateAdminProductMutation();
  const schema = useMemo(() => createAdminProductSchema(t), [t]);
  const submitting = createMutation.isPending || updateMutation.isPending;
  const editing = Boolean(product);

  const form = useForm<AdminProductFormValues>({
    resolver: zodResolver(schema) as Resolver<AdminProductFormValues>,
    defaultValues: adminProductDefaultValues,
    mode: "onTouched",
  });

  useEffect(() => {
    if (!open) return;
    form.reset(valuesFromProduct(product));
  }, [form, open, product]);

  const categoryOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: t("admin.products.category.none") },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
        description: category.parent?.name,
      })),
    ],
    [categories, t],
  );

  const unitOptions = useMemo<SelectOption[]>(
    () =>
      units.map((unit) => ({
        value: unit.id,
        label: `${unit.code} - ${unit.name}`,
      })),
    [units],
  );

  const submit = form.handleSubmit(async (values) => {
    const input: SaveProductInput = {
      ...values,
      preferredPurchaseCurrency: values.preferredPurchaseCurrency,
      preferredSaleCurrency: values.preferredSaleCurrency,
    };

    try {
      const saved = editing
        ? await updateMutation.mutateAsync({ id: product!.id, input })
        : await createMutation.mutateAsync(input);
      gooeyToast.success(
        editing
          ? t("admin.products.product.updatedTitle")
          : t("admin.products.product.createdTitle"),
        {
          description: t("admin.products.product.savedDescription", {
            name: saved.name,
          }),
        },
      );
      onClose();
    } catch (error) {
      gooeyToast.error(t("admin.products.product.saveFailedTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.products.product.saveFailedFallback"),
      });
    }
  });

  return (
    <FormModal
      open={open}
      title={
        editing
          ? t("admin.products.product.editTitle", { name: product?.name ?? "" })
          : t("admin.products.product.addTitle")
      }
      description={t("admin.products.product.modalDescription")}
      submitLabel={
        editing
          ? t("admin.products.product.update")
          : t("admin.products.product.create")
      }
      submittingLabel={t("admin.products.product.saving")}
      cancelLabel={t("admin.products.product.cancel")}
      closeLabel={t("admin.products.product.close")}
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
        label={t("admin.products.column.product")}
        placeholder={t("admin.products.product.namePlaceholder")}
        startIcon={<Package className="size-4" />}
        tone="light"
        containerClassName="sm:col-span-2"
      />
      <FormInputField
        control={form.control}
        name="sku"
        label={t("admin.products.column.sku")}
        placeholder={t("admin.products.product.skuPlaceholder")}
        startIcon={<Tag className="size-4" />}
        tone="light"
      />
      <FormInputField
        control={form.control}
        name="barcode"
        label={t("admin.products.column.barcode")}
        placeholder={t("admin.products.product.barcodePlaceholder")}
        startIcon={<Barcode className="size-4" />}
        tone="light"
      />
      <Controller
        control={form.control}
        name="categoryId"
        render={({ field, fieldState }) => (
          <SelectField
            label={t("admin.products.column.category")}
            options={categoryOptions}
            value={field.value ?? ""}
            onValueChange={field.onChange}
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
        name="baseUnitId"
        render={({ field, fieldState }) => (
          <SelectField
            label={t("admin.products.column.unit")}
            options={unitOptions}
            value={field.value}
            onValueChange={field.onChange}
            error={fieldState.error?.message}
            placeholder={t("admin.products.product.unitPlaceholder")}
            tone="light"
            searchable
            clearable={false}
            contentClassName="z-[1200]"
          />
        )}
      />
      <Controller
        control={form.control}
        name="preferredPurchaseCurrency"
        render={({ field }) => (
          <SelectField
            label={t("admin.products.product.purchaseCurrency")}
            options={currencyOptions}
            value={field.value}
            onValueChange={field.onChange}
            tone="light"
            clearable={false}
          />
        )}
      />
      <Controller
        control={form.control}
        name="preferredSaleCurrency"
        render={({ field }) => (
          <SelectField
            label={t("admin.products.product.saleCurrency")}
            options={currencyOptions}
            value={field.value}
            onValueChange={field.onChange}
            tone="light"
            clearable={false}
          />
        )}
      />
      <FormInputField
        control={form.control}
        name="standardCost"
        type="number"
        min={0}
        step="0.01"
        label={t("admin.products.column.standardCost")}
        startIcon={<DollarSign className="size-4" />}
        tone="light"
      />
      <FormInputField
        control={form.control}
        name="defaultSalePrice"
        type="number"
        min={0}
        step="0.01"
        label={t("admin.products.column.salePrice")}
        startIcon={<DollarSign className="size-4" />}
        tone="light"
      />
      <FormInputField
        control={form.control}
        name="reorderLevel"
        type="number"
        min={0}
        step="0.01"
        label={t("admin.products.column.reorder")}
        startIcon={<Boxes className="size-4" />}
        tone="light"
        containerClassName="sm:col-span-2"
      />
      <FormTextareaField
        control={form.control}
        name="description"
        label={t("admin.products.column.description")}
        placeholder={t("admin.products.product.descriptionPlaceholder")}
        tone="light"
        rows={4}
        containerClassName="sm:col-span-2"
      />
      <Controller
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <div className="flex min-h-12 items-center border border-light-border px-3 dark:border-dark-border">
            <ToggleSwitch
              id="admin-product-active"
              checked={field.value}
              onCheckedChange={field.onChange}
              label={t("admin.products.status.active")}
            />
          </div>
        )}
      />
    </FormModal>
  );
}

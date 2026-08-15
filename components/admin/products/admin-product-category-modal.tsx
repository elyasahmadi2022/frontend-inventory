"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FolderTree } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { gooeyToast } from "goey-toast";
import { FormInputField } from "@/components/common";
import { FormModal } from "@/components/common/form-modal";
import { SelectField, type SelectOption } from "@/components/common/select-field";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  useCreateAdminProductCategoryMutation,
  useUpdateAdminProductCategoryMutation,
} from "@/lib/query/hooks";
import {
  adminProductCategoryDefaultValues,
  createAdminProductCategorySchema,
  type AdminProductCategoryFormValues,
} from "@/lib/validation/admin-product-schemas";
import type { ProductCategoryRow } from "@/services/products.service";

type AdminProductCategoryModalProps = {
  categories: ProductCategoryRow[];
  category?: ProductCategoryRow | null;
  open: boolean;
  onClose: () => void;
};

export function AdminProductCategoryModal({
  categories,
  category,
  open,
  onClose,
}: AdminProductCategoryModalProps) {
  const { t } = useI18n();
  const createMutation = useCreateAdminProductCategoryMutation();
  const updateMutation = useUpdateAdminProductCategoryMutation();
  const schema = useMemo(() => createAdminProductCategorySchema(t), [t]);
  const editing = Boolean(category);
  const submitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<AdminProductCategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: adminProductCategoryDefaultValues,
    mode: "onTouched",
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: category?.name ?? "",
      parentId: category?.parentId ?? "",
    });
  }, [category, form, open]);

  const parentOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: t("admin.products.category.none") },
      ...categories
        .filter((item) => item.id !== category?.id)
        .map((item) => ({ value: item.id, label: item.name })),
    ],
    [categories, category?.id, t],
  );

  const submit = form.handleSubmit(async (values) => {
    try {
      const saved = editing
        ? await updateMutation.mutateAsync({ id: category!.id, input: values })
        : await createMutation.mutateAsync(values);
      gooeyToast.success(
        editing
          ? t("admin.products.category.updatedTitle")
          : t("admin.products.category.createdTitle"),
        {
          description: t("admin.products.category.savedDescription", {
            name: saved.name,
          }),
        },
      );
      onClose();
    } catch (error) {
      gooeyToast.error(t("admin.products.category.saveFailedTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.products.category.saveFailedFallback"),
      });
    }
  });

  return (
    <FormModal
      open={open}
      title={
        editing
          ? t("admin.products.category.editTitle", {
              name: category?.name ?? "",
            })
          : t("admin.products.category.addTitle")
      }
      description={t("admin.products.category.modalDescription")}
      submitLabel={
        editing
          ? t("admin.products.category.update")
          : t("admin.products.category.create")
      }
      submittingLabel={t("admin.products.category.saving")}
      cancelLabel={t("admin.products.product.cancel")}
      closeLabel={t("admin.products.product.close")}
      submitting={submitting}
      onClose={() => {
        if (!submitting) onClose();
      }}
      onSubmit={() => void submit()}
    >
      <FormInputField
        control={form.control}
        name="name"
        label={t("admin.products.column.category")}
        placeholder={t("admin.products.category.namePlaceholder")}
        startIcon={<FolderTree className="size-4" />}
        tone="light"
        containerClassName="sm:col-span-2"
      />
     <div className=" sm:col-span-2">
     <Controller
        control={form.control}
        name="parentId"
        render={({ field, fieldState }) => (
          <SelectField
            label={t("admin.products.category.parent")}
            options={parentOptions}
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
     </div>
    </FormModal>
  );
}

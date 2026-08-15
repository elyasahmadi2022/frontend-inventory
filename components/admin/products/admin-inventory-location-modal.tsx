"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { gooeyToast } from "goey-toast";
import { z } from "zod";
import { FormInputField } from "@/components/common";
import { FormModal } from "@/components/common/form-modal";
import { SelectField, type SelectOption } from "@/components/common/select-field";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useCreateAdminInventoryLocationMutation } from "@/lib/query/hooks";
import type {
  InventoryLocationRow,
  InventoryLocationType,
  SaveInventoryLocationInput,
} from "@/services/products.service";

type Props = {
  locations: InventoryLocationRow[];
  open: boolean;
  onClose: () => void;
};

type LocationValues = {
  code: string;
  name: string;
  type: InventoryLocationType;
  parentId: string;
};

const defaultValues: LocationValues = {
  code: "",
  name: "",
  type: "warehouse",
  parentId: "",
};

const schema = z.object({
  code: z.string().trim().optional(),
  name: z.string().trim().min(2).max(120),
  type: z.enum(["warehouse", "store", "shelf", "in_transit", "damaged"]),
  parentId: z.string().trim().optional(),
});

export function AdminInventoryLocationModal({
  locations,
  open,
  onClose,
}: Props) {
  const { t } = useI18n();
  const createMutation = useCreateAdminInventoryLocationMutation();
  const form = useForm<LocationValues>({
    resolver: zodResolver(schema) as Resolver<LocationValues>,
    defaultValues,
    mode: "onTouched",
  });

  useEffect(() => {
    if (open) form.reset(defaultValues);
  }, [form, open]);

  const typeOptions = useMemo<SelectOption[]>(
    () => [
      { value: "warehouse", label: t("admin.products.location.type.warehouse") },
      { value: "store", label: t("admin.products.location.type.store") },
      { value: "shelf", label: t("admin.products.location.type.shelf") },
      { value: "in_transit", label: t("admin.products.location.type.inTransit") },
      { value: "damaged", label: t("admin.products.location.type.damaged") },
    ],
    [t],
  );
  const parentOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: t("admin.products.location.noParent") },
      ...locations.map((location) => ({
        value: location.id,
        label: `${location.code} - ${location.name}`,
        description: t(
          `admin.products.location.type.${location.type === "in_transit" ? "inTransit" : location.type}` as never,
        ),
      })),
    ],
    [locations, t],
  );

  const submit = form.handleSubmit(async (values) => {
    const input: SaveInventoryLocationInput = {
      code: values.code,
      name: values.name,
      type: values.type,
      parentId: values.parentId,
      isActive: true,
    };

    try {
      const saved = await createMutation.mutateAsync(input);
      gooeyToast.success(t("admin.products.location.createdTitle"), {
        description: t("admin.products.location.savedDescription", {
          name: saved.name,
        }),
      });
      onClose();
    } catch (error) {
      gooeyToast.error(t("admin.products.location.saveFailedTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.products.location.saveFailedFallback"),
      });
    }
  });

  return (
    <FormModal
      open={open}
      title={t("admin.products.location.addTitle")}
      description={t("admin.products.location.modalDescription")}
      submitLabel={t("admin.products.location.create")}
      submittingLabel={t("admin.products.location.saving")}
      cancelLabel={t("admin.products.product.cancel")}
      closeLabel={t("admin.products.product.close")}
      submitting={createMutation.isPending}
      onClose={() => {
        if (!createMutation.isPending) onClose();
      }}
      onSubmit={() => void submit()}
      panelClassName="max-w-3xl"
    >
      <FormInputField
        control={form.control}
        name="name"
        label={t("admin.products.location.name")}
        placeholder={t("admin.products.location.namePlaceholder")}
        startIcon={<MapPin className="size-4" />}
        tone="light"
      />
      <Controller
        control={form.control}
        name="type"
        render={({ field, fieldState }) => (
          <SelectField
            label={t("admin.products.stock.locationType")}
            options={typeOptions}
            value={field.value}
            onValueChange={field.onChange}
            error={fieldState.error?.message}
            tone="light"
            clearable={false}
          />
        )}
      />
      <div className="sm:col-span-2">
        <Controller
          control={form.control}
          name="parentId"
          render={({ field, fieldState }) => (
            <SelectField
              label={t("admin.products.location.parent")}
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

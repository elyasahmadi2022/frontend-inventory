import { z } from "zod";
import type { TranslationKey } from "@/lib/i18n";

type T = (key: TranslationKey, values?: Record<string, string | number>) => string;

const optionalText = z
  .string()
  .trim()
  .optional();

const moneyNumber = (t: T) =>
  z.coerce.number().min(0, t("admin.products.validation.positiveNumber"));

export function createAdminProductSchema(t: T) {
  return z.object({
    sku: optionalText,
    barcode: optionalText,
    name: z
      .string()
      .trim()
      .min(2, t("admin.products.validation.nameRequired"))
      .max(160, t("admin.products.validation.nameMax")),
    description: optionalText,
    categoryId: optionalText,
    baseUnitId: z.string().trim().min(1, t("admin.products.validation.unitRequired")),
    preferredPurchaseCurrency: z.enum(["AFN", "USD", "PKR"]),
    preferredSaleCurrency: z.enum(["AFN", "USD", "PKR"]),
    standardCost: moneyNumber(t),
    defaultSalePrice: moneyNumber(t),
    reorderLevel: moneyNumber(t),
    isActive: z.boolean(),
  });
}

export type AdminProductFormValues = z.infer<
  ReturnType<typeof createAdminProductSchema>
>;

export const adminProductDefaultValues: AdminProductFormValues = {
  sku: "",
  barcode: "",
  name: "",
  description: "",
  categoryId: "",
  baseUnitId: "",
  preferredPurchaseCurrency: "USD",
  preferredSaleCurrency: "AFN",
  standardCost: 0,
  defaultSalePrice: 0,
  reorderLevel: 0,
  isActive: true,
};

export function createAdminProductCategorySchema(t: T) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, t("admin.products.validation.categoryNameRequired"))
      .max(120, t("admin.products.validation.categoryNameMax")),
    parentId: optionalText,
  });
}

export type AdminProductCategoryFormValues = z.infer<
  ReturnType<typeof createAdminProductCategorySchema>
>;

export const adminProductCategoryDefaultValues: AdminProductCategoryFormValues = {
  name: "",
  parentId: "",
};

import { z } from "zod";
import { getLocalDateString } from "@/lib/date-format";
import type { TranslationKey } from "@/lib/i18n";

type T = (
  key: TranslationKey,
  values?: Record<string, string | number>,
) => string;

const optionalText = z.string().trim().optional();
const positiveNumber = (t: T) =>
  z.coerce.number().positive(t("admin.sales.validation.positiveNumber"));
const zeroOrPositive = (t: T) =>
  z.coerce.number().min(0, t("admin.sales.validation.zeroOrPositive"));
const moneyUnits = (value: number) => Math.round(Number(value || 0) * 100);

export function createAdminSaleSchema(t: T) {
  return z
    .object({
      customerId: z
        .string()
        .trim()
        .min(1, t("admin.sales.validation.customerRequired")),
      invoiceDate: z
        .string()
        .trim()
        .min(1, t("admin.sales.validation.invoiceDateRequired")),
      dueDate: optionalText,
      currencyCode: z.enum(["AFN", "USD", "PKR"]),
      exchangeRateToBase: positiveNumber(t).default(1),
      revenueAccountId: optionalText,
      inventoryAccountId: optionalText,
      cogsAccountId: optionalText,
      taxTotal: zeroOrPositive(t),
      receiptAccountId: optionalText,
      receivedAmount: zeroOrPositive(t),
      notes: optionalText,
      lines: z
        .array(
          z.object({
            productId: z
              .string()
              .trim()
              .min(1, t("admin.sales.validation.productRequired")),
            locationId: z
              .string()
              .trim()
              .min(1, t("admin.sales.validation.locationRequired")),
            description: optionalText,
            quantity: positiveNumber(t),
            unitPrice: zeroOrPositive(t),
            unitCost: zeroOrPositive(t).optional(),
            discount: zeroOrPositive(t),
          }),
        )
        .min(1, t("admin.sales.validation.lineRequired")),
    })
    .refine(
      (data) => {
        const lineTotal = data.lines.reduce(
          (sum, line) => sum + line.quantity * line.unitPrice - line.discount,
          0,
        );
        return (
          moneyUnits(data.receivedAmount) <=
          moneyUnits(lineTotal + data.taxTotal)
        );
      },
      {
        message: t("admin.sales.validation.receivedTooHigh"),
        path: ["receivedAmount"],
      },
    );
}

export type AdminSaleFormValues = z.infer<
  ReturnType<typeof createAdminSaleSchema>
>;

export const adminSaleDefaultValues: AdminSaleFormValues = {
  customerId: "",
  invoiceDate: getLocalDateString(),
  dueDate: "",
  currencyCode: "AFN",
  exchangeRateToBase: 1,
  revenueAccountId: "",
  inventoryAccountId: "",
  cogsAccountId: "",
  taxTotal: 0,
  receiptAccountId: "",
  receivedAmount: 0,
  notes: "",
  lines: [],
};

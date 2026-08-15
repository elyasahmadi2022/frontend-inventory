import { z } from "zod";
import { getLocalDateString } from "@/lib/date-format";
import type { TranslationKey } from "@/lib/i18n";

type T = (
  key: TranslationKey,
  values?: Record<string, string | number>,
) => string;

const optionalText = z.string().trim().optional();
const positiveNumber = (t: T) =>
  z.coerce.number().positive(t("admin.purchases.validation.positiveNumber"));
const zeroOrPositive = (t: T) =>
  z.coerce.number().min(0, t("admin.purchases.validation.zeroOrPositive"));
const moneyUnits = (value: number) => Math.round(Number(value || 0) * 100);

export function createAdminPurchaseSchema(t: T) {
  return z
    .object({
      vendorId: z
        .string()
        .trim()
        .min(1, t("admin.purchases.validation.vendorRequired")),
      billDate: z
        .string()
        .trim()
        .min(1, t("admin.purchases.validation.billDateRequired")),
      dueDate: optionalText,
      currencyCode: z.enum(["AFN", "USD", "PKR"]),
      exchangeRateToBase: positiveNumber(t).default(1),
      inventoryAccountId: optionalText,
      expenseAccountId: optionalText,
      taxTotal: zeroOrPositive(t),
      paymentAccountId: optionalText,
      paidAmount: zeroOrPositive(t),
      notes: optionalText,
      lines: z
        .array(
          z.object({
            productId: z
              .string()
              .trim()
              .min(1, t("admin.purchases.validation.productRequired")),
            locationId: z
              .string()
              .trim()
              .min(1, t("admin.purchases.validation.locationRequired")),
            description: optionalText,
            quantity: positiveNumber(t),
            unitCost: zeroOrPositive(t),
            discount: zeroOrPositive(t),
          }),
        )
        .min(1, t("admin.purchases.validation.lineRequired")),
    })
    .refine(
      (data) => {
        const lineTotal = data.lines.reduce(
          (sum, line) => sum + line.quantity * line.unitCost - line.discount,
          0,
        );
        return (
          moneyUnits(data.paidAmount) <= moneyUnits(lineTotal + data.taxTotal)
        );
      },
      {
        message: t("admin.purchases.validation.paidTooHigh"),
        path: ["paidAmount"],
      },
    );
}

export type AdminPurchaseFormValues = z.infer<
  ReturnType<typeof createAdminPurchaseSchema>
>;

export const adminPurchaseDefaultValues: AdminPurchaseFormValues = {
  vendorId: "",
  billDate: getLocalDateString(),
  dueDate: "",
  currencyCode: "AFN",
  exchangeRateToBase: 1,
  inventoryAccountId: "",
  expenseAccountId: "",
  taxTotal: 0,
  paymentAccountId: "",
  paidAmount: 0,
  notes: "",
  lines: [],
};

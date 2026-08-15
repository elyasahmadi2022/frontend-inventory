import { z } from "zod";
import { getLocalDateString } from "@/lib/date-format";
import type { TranslationKey } from "@/lib/i18n";

type T = (
  key: TranslationKey,
  values?: Record<string, string | number>,
) => string;

const optionalText = z.string().trim().optional();

export function createAdminTransferSchema(t: T) {
  return z
    .object({
      transferDate: z
        .string()
        .trim()
        .min(1, t("admin.transfers.validation.dateRequired")),
      fromAccountId: z
        .string()
        .trim()
        .min(1, t("admin.transfers.validation.fromRequired")),
      toAccountId: z
        .string()
        .trim()
        .min(1, t("admin.transfers.validation.toRequired")),
      currencyCode: z.enum(["AFN", "USD", "PKR"]),
      destinationCurrencyCode: z.enum(["AFN", "USD", "PKR"]).optional(),
      destinationAmount: z.coerce
        .number()
        .finite()
        .positive(t("admin.transfers.validation.positiveNumber"))
        .optional(),
      conversionRate: z.coerce
        .number()
        .finite()
        .positive(t("admin.transfers.validation.positiveNumber"))
        .optional(),
      exchangeRateToBase: z.coerce
        .number()
        .positive(t("admin.transfers.validation.positiveNumber")),
      amount: z.coerce
        .number()
        .finite()
        .positive(t("admin.transfers.validation.positiveNumber")),
      feeAmount: z.coerce
        .number()
        .min(0)
        .max(0, t("admin.transfers.validation.noFees")),
      notes: optionalText,
    })
    .refine((data) => data.fromAccountId !== data.toAccountId, {
      message: t("admin.transfers.validation.differentAccounts"),
      path: ["toAccountId"],
    })
    .superRefine((data, ctx) => {
      if (
        data.destinationCurrencyCode &&
        data.destinationCurrencyCode !== data.currencyCode &&
        !data.conversionRate
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["conversionRate"],
          message: t("admin.transfers.validation.rateRequired"),
        });
      }
    });
}

export type AdminTransferFormValues = z.infer<
  ReturnType<typeof createAdminTransferSchema>
>;

export const adminTransferDefaultValues: AdminTransferFormValues = {
  transferDate: getLocalDateString(),
  fromAccountId: "",
  toAccountId: "",
  currencyCode: "AFN",
  destinationCurrencyCode: undefined,
  destinationAmount: undefined,
  conversionRate: undefined,
  exchangeRateToBase: 1,
  amount: 0,
  feeAmount: 0,
  notes: "",
};

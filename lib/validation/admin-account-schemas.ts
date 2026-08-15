import { z } from "zod";
import type { TranslationKey } from "@/lib/i18n";

type T = (key: TranslationKey, values?: Record<string, string | number>) => string;

const optionalText = z.string().trim().optional();

export function createAdminAccountSchema(t: T) {
  return z.object({
    code: optionalText,
    name: z.string().trim().min(2, t("admin.accounts.validation.nameRequired")),
    category: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
    type: z.enum([
      "cash",
      "bank",
      "sarafi",
      "daskhil",
      "accounts_receivable",
      "accounts_payable",
      "inventory",
      "cost_of_goods_sold",
      "sales_revenue",
      "purchase",
      "expense",
      "equity",
      "liability",
      "exchange_gain",
      "exchange_loss",
      "other",
    ]),
    normalBalance: z.enum(["debit", "credit"]),
    currencyCode: z.string().min(1, t("admin.accounts.validation.currencyRequired")),
    parentId: optionalText,
    isControlAccount: z.boolean(),
    isActive: z.boolean(),
  });
}

export type AdminAccountFormValues = z.infer<
  ReturnType<typeof createAdminAccountSchema>
>;

export const adminAccountDefaultValues: AdminAccountFormValues = {
  code: "",
  name: "",
  category: "asset",
  type: "cash",
  normalBalance: "debit",
  currencyCode: "AFN",
  parentId: "",
  isControlAccount: false,
  isActive: true,
};

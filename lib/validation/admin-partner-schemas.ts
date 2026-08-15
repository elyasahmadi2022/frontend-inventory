import { z } from "zod";
import type { TranslationKey } from "@/lib/i18n";

type T = (key: TranslationKey, values?: Record<string, string | number>) => string;

const optionalText = z.string().trim().optional();

export function createAdminPartnerSchema(t: T) {
  return z.object({
    code: optionalText,
    name: z.string().trim().min(2, t("admin.partners.validation.nameRequired")),
    type: z.enum(["customer", "vendor", "both", "sarafi", "staff"]),
    phone: optionalText,
    address: optionalText,
    receivableAccountId: optionalText,
    payableAccountId: optionalText,
    isActive: z.boolean(),
  });
}

export type AdminPartnerFormValues = z.infer<
  ReturnType<typeof createAdminPartnerSchema>
>;

export const adminPartnerDefaultValues: AdminPartnerFormValues = {
  code: "",
  name: "",
  type: "customer",
  phone: "",
  address: "",
  receivableAccountId: "",
  payableAccountId: "",
  isActive: true,
};

export function createAdminPartnerLedgerSchema(t: T) {
  return z.object({
    accountId: z.string().trim().min(1, t("admin.partners.validation.accountRequired")),
    currencyCode: z.enum(["AFN", "USD", "PKR"]),
    type: z.enum([
      "receivable",
      "payable",
      "advance_received",
      "advance_paid",
      "deposit",
    ]),
    isDefault: z.boolean(),
  });
}

export type AdminPartnerLedgerFormValues = z.infer<
  ReturnType<typeof createAdminPartnerLedgerSchema>
>;

export const adminPartnerLedgerDefaultValues: AdminPartnerLedgerFormValues = {
  accountId: "",
  currencyCode: "AFN",
  type: "receivable",
  isDefault: false,
};

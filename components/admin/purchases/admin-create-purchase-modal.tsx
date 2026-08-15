"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import type { MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  buildAssetAccountOptions,
  renderAssetAccountOption,
} from "@/components/admin/shared/asset-account-options";
import {
  Controller,
  useFieldArray,
  useForm,
  type Resolver,
} from "react-hook-form";
import { gooeyToast } from "goey-toast";
import {
  FormDatePickerField,
  FormInputField,
  FormTextareaField,
} from "@/components/common";
import { FormModal } from "@/components/common/form-modal";
import { InputField } from "@/components/common/input-field";
import {
  SelectField,
  type SelectOption,
} from "@/components/common/select-field";
import { CurrencyFlagIcon } from "@/components/common/currency-flag-icon";
import { ApiError } from "@/lib/api";
import { getLocalDateString } from "@/lib/date-format";
import { useI18n } from "@/lib/i18n";
import {
  useAdminCurrenciesQuery,
  useCreateAdminPurchaseMutation,
  useUpdateAdminPurchaseMutation,
} from "@/lib/query/hooks";
import {
  adminPurchaseDefaultValues,
  createAdminPurchaseSchema,
  type AdminPurchaseFormValues,
} from "@/lib/validation/admin-purchase-schemas";
import type { AccountRow } from "@/services/accounts.service";
import {
  fetchConversionRate,
  type CurrencyCode,
} from "@/services/currencies.service";
import type { PartnerRow } from "@/services/partners.service";
import type {
  InventoryLocationRow,
  ProductRow,
} from "@/services/products.service";
import type { PurchaseRow } from "@/services/purchases.service";

type Props = {
  accounts: AccountRow[];
  locations: InventoryLocationRow[];
  open: boolean;
  preselectedVendorId?: string | null;
  products: ProductRow[];
  vendors: PartnerRow[];
  purchase?: PurchaseRow | null;
  onClose: () => void;
};

type DraftLine = {
  productId: string;
  locationId: string;
  quantity: number;
  sourceUnitCost: number;
  sourceCurrency: CurrencyCode | "";
  conversionRate: number;
  unitCost: number;
  discount: number;
};

type PricingBridge = {
  sourceCurrency: CurrencyCode;
  productToDocumentRate: number;
};

const emptyLine: DraftLine = {
  productId: "",
  locationId: "",
  quantity: 1,
  sourceUnitCost: 0,
  sourceCurrency: "",
  conversionRate: 1,
  unitCost: 0,
  discount: 0,
};

const currencyOptions: SelectOption[] = [
  {
    value: "AFN",
    label: "Afghani (AFN)",
    searchText: "AFN Afghani",
    icon: <CurrencyFlagIcon currency="AFN" className="h-4 w-6" />,
  },
  {
    value: "USD",
    label: "US Dollar (USD)",
    searchText: "USD Dollar",
    icon: <CurrencyFlagIcon currency="USD" className="h-4 w-6" />,
  },
  {
    value: "PKR",
    label: "Pakistani Rupee (PKR)",
    searchText: "PKR Rupee",
    icon: <CurrencyFlagIcon currency="PKR" className="h-4 w-6" />,
  },
];

function money(value: number) {
  return Number(value || 0).toLocaleString();
}

function buildEmptyLine(locationId = ""): DraftLine {
  return {
    ...emptyLine,
    locationId,
  };
}

export function AdminCreatePurchaseModal({
  accounts,
  locations,
  open,
  preselectedVendorId = null,
  products,
  vendors,
  purchase = null,
  onClose,
}: Props) {
  const { language, t } = useI18n();
  const createMutation = useCreateAdminPurchaseMutation();
  const updateMutation = useUpdateAdminPurchaseMutation();
  const currenciesQuery = useAdminCurrenciesQuery();
  const schema = useMemo(() => createAdminPurchaseSchema(t), [t]);
  const [draftLine, setDraftLine] = useState<DraftLine>(emptyLine);
  const [, setConversionNote] = useState<string | null>(null);
  const [pricingBridge, setPricingBridge] = useState<PricingBridge | null>(
    null,
  );
  const isEdit = Boolean(purchase);
  const submitting = createMutation.isPending || updateMutation.isPending;
  const form = useForm<AdminPurchaseFormValues>({
    resolver: zodResolver(schema) as Resolver<AdminPurchaseFormValues>,
    defaultValues: adminPurchaseDefaultValues,
    mode: "onTouched",
  });
  const lines = useFieldArray({ control: form.control, name: "lines" });
  const currencyCode = form.watch("currencyCode");
  const watchedLines = form.watch("lines");
  const taxTotal = Number(form.watch("taxTotal") ?? 0);
  const paidAmount = Number(form.watch("paidAmount") ?? 0);
  const productExchangeRate = Number(form.watch("exchangeRateToBase") ?? 1);
  const defaultLocationId = useMemo(() => locations[0]?.id ?? "", [locations]);
  const baseCurrency =
    currenciesQuery.data?.find((currency) => currency.isBase)?.code ?? "AFN";

  useEffect(() => {
    if (!draftLine.productId || !draftLine.sourceCurrency) return;
    const rate =
      draftLine.sourceCurrency === currencyCode ? 1 : productExchangeRate;
    if (rate <= 0) return;
    setDraftLine((current) => ({
      ...current,
      conversionRate: rate,
      unitCost: current.sourceUnitCost * rate,
    }));
    setPricingBridge({
      sourceCurrency: draftLine.sourceCurrency,
      productToDocumentRate: rate,
    });
  }, [
    currencyCode,
    draftLine.productId,
    draftLine.sourceCurrency,
    productExchangeRate,
  ]);

  useEffect(() => {
    if (!open) return;
    if (purchase) {
      form.reset({
        vendorId: purchase.vendorId,
        billDate: purchase.billDate?.slice(0, 10) ?? getLocalDateString(),
        dueDate: purchase.dueDate?.slice(0, 10) ?? "",
        currencyCode: purchase.currencyCode,
        exchangeRateToBase: 1,
        inventoryAccountId: "",
        expenseAccountId: "",
        taxTotal: Number(purchase.taxTotal ?? 0),
        paymentAccountId: "",
        paidAmount: Number(purchase.paidTotal ?? 0),
        notes: purchase.notes ?? "",
        lines: (purchase.lines ?? []).map((line) => ({
          productId: line.productId,
          locationId: line.locationId,
          description: line.description ?? "",
          quantity: Number(line.quantity),
          unitCost: Number(line.unitCost),
          discount: Number(line.discount),
        })),
      });
    } else {
      form.reset({
        ...adminPurchaseDefaultValues,
        vendorId: preselectedVendorId ?? "",
      });
    }
    setDraftLine(buildEmptyLine(defaultLocationId));
  }, [defaultLocationId, form, open, preselectedVendorId, purchase]);

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const vendorOptions = useMemo<SelectOption[]>(
    () =>
      vendors.map((vendor) => ({
        value: vendor.id,
        label: `${vendor.code} - ${vendor.name}`,
        description: vendor.type,
      })),
    [vendors],
  );
  const productOptions = useMemo<SelectOption[]>(
    () =>
      products
        .filter((product) => product.isActive)
        .map((product) => {
          const stock = (product.inventoryBalances ?? []).reduce(
            (sum, balance) => sum + Number(balance.quantityOnHand ?? 0),
            0,
          );
          return {
            value: product.id,
            label: `${product.sku} - ${product.name}`,
            description: `${money(stock)} ${product.baseUnit?.code ?? "unit"} · standard ${money(Number(product.standardCost))} ${product.preferredPurchaseCurrency}`,
          };
        }),
    [products],
  );
  const locationOptions = useMemo<SelectOption[]>(
    () =>
      locations.map((location) => ({
        value: location.id,
        label: `${location.code} - ${location.name}`,
      })),
    [locations],
  );
  const paymentAccountById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );
  const paymentAccountOptions = useMemo<SelectOption[]>(
    () => buildAssetAccountOptions(accounts, currencyCode, language),
    [accounts, currencyCode, language],
  );
  const subtotal = watchedLines.reduce(
    (sum, line) =>
      sum +
      Number(line.quantity || 0) * Number(line.unitCost || 0) -
      Number(line.discount || 0),
    0,
  );
  const total = subtotal + taxTotal;
  const balance = Math.max(total - paidAmount, 0);

  function updateDraftLine(patch: Partial<DraftLine>) {
    setDraftLine((current) => ({ ...current, ...patch }));
  }

  async function convertedAmount(
    amount: number,
    from: CurrencyCode,
    to: CurrencyCode,
  ) {
    if (from === to) return { amount, rate: 1 };
    const conversion = await fetchConversionRate(
      from,
      to,
      form.getValues("billDate"),
    );
    return {
      amount: amount * Number(conversion.rate),
      rate: Number(conversion.rate),
    };
  }

  async function selectProduct(value: string) {
    const product = productById.get(value);
    if (!product) return;
    const sourceCurrency = product.preferredPurchaseCurrency;
    const sourceCost = Number(product.standardCost ?? 0);
    try {
      const converted = await convertedAmount(
        sourceCost,
        sourceCurrency,
        currencyCode,
      );
      form.setValue("exchangeRateToBase", converted.rate, {
        shouldDirty: true,
        shouldValidate: true,
      });
      updateDraftLine({
        productId: value,
        sourceUnitCost: sourceCost,
        sourceCurrency,
        conversionRate: converted.rate,
        unitCost: converted.amount,
      });
      setPricingBridge({
        sourceCurrency,
        productToDocumentRate: converted.rate,
      });
      setConversionNote(
        sourceCurrency === currencyCode
          ? null
          : `${money(sourceCost)} ${sourceCurrency} × ${converted.rate.toLocaleString()} = ${money(converted.amount)} ${currencyCode}`,
      );
    } catch {
      form.setValue("exchangeRateToBase", 1, {
        shouldDirty: true,
        shouldValidate: true,
      });
      updateDraftLine({
        productId: value,
        sourceUnitCost: sourceCost,
        sourceCurrency,
        conversionRate: 1,
        unitCost: sourceCost,
      });
      setPricingBridge({ sourceCurrency, productToDocumentRate: 1 });
      setConversionNote(
        `${money(sourceCost)} ${sourceCurrency}. Enter how many ${currencyCode} equal 1 ${sourceCurrency}.`,
      );
    }
  }

  async function changeLineCurrency(value: string) {
    const nextCurrency = value as CurrencyCode;
    try {
      const converted = await convertedAmount(
        draftLine.sourceUnitCost,
        nextCurrency,
        currencyCode,
      );
      form.setValue("exchangeRateToBase", converted.rate, {
        shouldDirty: true,
        shouldValidate: true,
      });
      updateDraftLine({
        sourceCurrency: nextCurrency,
        conversionRate: converted.rate,
        unitCost: converted.amount,
      });
      setPricingBridge({
        sourceCurrency: nextCurrency,
        productToDocumentRate: converted.rate,
      });
    } catch (error) {
      gooeyToast.error(
        error instanceof ApiError
          ? error.message
          : "Unable to convert the line cost.",
      );
    }
  }

  function changeSourceUnitCost(value: number) {
    updateDraftLine({
      sourceUnitCost: value,
      unitCost: value * draftLine.conversionRate,
    });
  }

  async function changeCurrency(value: string) {
    const nextCurrency = value as CurrencyCode;
    const previousCurrency = currencyCode as CurrencyCode;
    if (nextCurrency === previousCurrency) return;
    const currentLines = form.getValues("lines");
    if (currentLines.length === 0) {
      form.setValue("currencyCode", nextCurrency, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setDraftLine(buildEmptyLine(defaultLocationId));
      setConversionNote(null);
      setPricingBridge(null);
      return;
    }
    try {
      const conversion = await fetchConversionRate(
        previousCurrency,
        nextCurrency,
        form.getValues("billDate"),
      );
      const rate = Number(conversion.rate);
      form.setValue(
        "lines",
        form.getValues("lines").map((line) => ({
          ...line,
          unitCost: Number(line.unitCost) * rate,
          discount: Number(line.discount) * rate,
        })),
        { shouldDirty: true, shouldValidate: true },
      );
      form.setValue("taxTotal", Number(form.getValues("taxTotal")) * rate);
      form.setValue("paidAmount", Number(form.getValues("paidAmount")) * rate);
      form.setValue("currencyCode", nextCurrency, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setDraftLine(buildEmptyLine(defaultLocationId));
      setConversionNote(
        `${previousCurrency} × ${rate.toLocaleString()} = ${nextCurrency}`,
      );
    } catch (error) {
      form.setValue("currencyCode", nextCurrency, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setDraftLine(buildEmptyLine(defaultLocationId));
      setConversionNote(null);
      setPricingBridge(null);
      gooeyToast.error(
        error instanceof ApiError
          ? `${error.message}. Existing line amounts were not converted.`
          : "Currency changed, but existing line amounts could not be converted.",
      );
    }
  }

  function addLine(event?: MouseEvent<HTMLButtonElement>) {
    event?.preventDefault();
    event?.stopPropagation();

    const product = productById.get(draftLine.productId);
    if (!draftLine.productId || !product) {
      gooeyToast.error(t("admin.purchases.validation.productRequired"));
      return;
    }

    if (!draftLine.locationId) {
      gooeyToast.error(t("admin.purchases.validation.locationRequired"));
      return;
    }

    if (draftLine.quantity <= 0) {
      gooeyToast.error(t("admin.purchases.validation.positiveNumber"));
      return;
    }

    if (
      draftLine.sourceCurrency &&
      draftLine.sourceCurrency !== currencyCode &&
      draftLine.conversionRate <= 0
    ) {
      gooeyToast.error("Enter a valid product exchange rate.");
      return;
    }

    const newLineTotal =
      Number(draftLine.quantity) * Number(draftLine.unitCost) -
      Number(draftLine.discount);
    const shouldDefaultToFullPayment =
      watchedLines.length === 0 ||
      Math.round(paidAmount * 100) === Math.round(total * 100);

    lines.append({
      productId: draftLine.productId,
      locationId: draftLine.locationId,
      description: `${draftLine.quantity} × ${product.sku} - ${product.name} (${form.getValues("billDate")})`,
      quantity: Number(draftLine.quantity),
      unitCost: Number(draftLine.unitCost),
      discount: Number(draftLine.discount),
    });
    if (shouldDefaultToFullPayment) {
      form.setValue("paidAmount", total + newLineTotal, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    setDraftLine(buildEmptyLine(defaultLocationId));
  }

  const submit = form.handleSubmit(async (values) => {
    try {
      let accountingRate = 1;
      if (values.currencyCode !== baseCurrency) {
        try {
          accountingRate = (
            await fetchConversionRate(
              values.currencyCode,
              baseCurrency,
              values.billDate,
            )
          ).rate;
        } catch {
          if (pricingBridge && pricingBridge.productToDocumentRate > 0) {
            const sourceToBase =
              pricingBridge.sourceCurrency === baseCurrency
                ? 1
                : await fetchConversionRate(
                    pricingBridge.sourceCurrency,
                    baseCurrency,
                    values.billDate,
                  )
                    .then((result) => result.rate)
                    .catch(() => 1);
            accountingRate = sourceToBase / pricingBridge.productToDocumentRate;
          } else {
            accountingRate = 1;
          }
        }
      }
      const accountingValues = {
        ...values,
        exchangeRateToBase: accountingRate,
        productExchangeRate:
          pricingBridge && pricingBridge.productToDocumentRate > 0
            ? pricingBridge.productToDocumentRate
            : 1,
      };
      if (isEdit && purchase) {
        const updated = await updateMutation.mutateAsync({
          id: purchase.id,
          input: accountingValues,
        });
        gooeyToast.success(t("admin.purchases.edit.successTitle"), {
          description: t("admin.purchases.edit.successDescription", {
            number: updated.number,
          }),
        });
      } else {
        const created = await createMutation.mutateAsync(accountingValues);
        gooeyToast.success(t("admin.purchases.create.successTitle"), {
          description: t("admin.purchases.create.successDescription", {
            number: created.number,
          }),
        });
      }
      onClose();
    } catch (error) {
      gooeyToast.error(
        isEdit
          ? t("admin.purchases.edit.errorTitle")
          : t("admin.purchases.create.errorTitle"),
        {
          description:
            error instanceof ApiError
              ? error.message
              : isEdit
                ? t("admin.purchases.edit.errorFallback")
                : t("admin.purchases.create.errorFallback"),
        },
      );
    }
  });

  return (
    <FormModal
      open={open}
      title={
        isEdit
          ? t("admin.purchases.edit.title")
          : t("admin.purchases.create.title")
      }
      description={
        isEdit && purchase
          ? t("admin.purchases.edit.description", { number: purchase.number })
          : t("admin.purchases.create.description")
      }
      submitLabel={
        isEdit
          ? t("admin.purchases.edit.submit")
          : t("admin.purchases.create.submit")
      }
      submittingLabel={
        isEdit
          ? t("admin.purchases.edit.submitting")
          : t("admin.purchases.create.submitting")
      }
      cancelLabel={t("admin.purchases.create.cancel")}
      closeLabel={t("admin.purchases.create.close")}
      submitting={submitting}
      onClose={() => {
        if (!submitting) onClose();
      }}
      onSubmit={() => void submit()}
      panelClassName="max-w-6xl"
      contentClassName="!flex flex-col gap-1"
    >
      <div className="order-1 grid gap-3 border border-light-border bg-light-bg/40 p-3 dark:border-dark-border dark:bg-dark-bg/30 md:grid-cols-2">
        <Controller
          control={form.control}
          name="currencyCode"
          render={({ field }) => (
            <SelectField
              label={t("admin.purchases.column.currency")}
              options={currencyOptions}
              value={field.value}
              onValueChange={(value) => void changeCurrency(value)}
              tone="light"
              clearable={false}
            />
          )}
        />
        <FormInputField
          control={form.control}
          name="exchangeRateToBase"
          type="number"
          min={0.000001}
          step="0.000001"
          label={
            draftLine.sourceCurrency
              ? t("admin.currency.exchangeEquation", {
                  source: draftLine.sourceCurrency,
                  target: currencyCode,
                })
              : t("admin.currency.productCurrencyTo", {
                  currency: currencyCode,
                })
          }
          tone="light"
        />
      </div>

      <div className="order-3 grid gap-3 lg:grid-cols-2">
        <Controller
          control={form.control}
          name="vendorId"
          render={({ field, fieldState }) => (
            <SelectField
              label={t("admin.purchases.column.vendor")}
              options={vendorOptions}
              value={field.value}
              onValueChange={field.onChange}
              error={fieldState.error?.message}
              tone="light"
              searchable
              clearable={false}
              contentClassName="z-[1200]"
            />
          )}
        />
        <FormDatePickerField
          control={form.control}
          name="billDate"
          label={t("admin.purchases.form.billDate")}
          tone="light"
        />
        <FormDatePickerField
          control={form.control}
          name="dueDate"
          label={t("admin.purchases.form.dueDate")}
          tone="light"
        />
        <FormInputField
          control={form.control}
          name="taxTotal"
          type="number"
          min={0}
          step="0.01"
          label={t("admin.purchases.column.tax")}
          tone="light"
        />
        <FormInputField
          control={form.control}
          name="paidAmount"
          type="number"
          min={0}
          step="0.01"
          label={t("admin.purchases.column.paid")}
          startIcon={<CreditCard className="size-4" />}
          tone="light"
        />
        <Controller
          control={form.control}
          name="paymentAccountId"
          render={({ field, fieldState }) => (
            <SelectField
              label={t("admin.purchases.form.paymentAccount")}
              options={paymentAccountOptions}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              renderOption={(option) =>
                renderAssetAccountOption(
                  option,
                  paymentAccountById,
                  currencyCode,
                  language,
                )
              }
              error={fieldState.error?.message}
              tone="light"
              searchable
              clearable
              contentClassName="z-[1200]"
            />
          )}
        />
        <div className="border border-light-border bg-light-bg/40 p-3 text-sm text-muted dark:border-dark-border dark:bg-dark-bg/30 lg:col-span-2">
          {t("admin.purchases.form.accountingNote")}
        </div>
      </div>

      <div className="order-4 grid gap-2 rounded-sm border border-light-border bg-light-bg/40 p-3 text-sm dark:border-dark-border dark:bg-dark-bg/30 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t("admin.purchases.form.paidAmount")}
          </p>
          <p className="mt-1 font-semibold">
            <span className="inline-flex items-center gap-1.5">
              {money(paidAmount)}{" "}
              <CurrencyFlagIcon currency={currencyCode} className="h-4 w-6" />
              <span className="sr-only">{currencyCode}</span>
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t("admin.purchases.column.balance")}
          </p>
          <p className="mt-1 font-semibold text-rose-700 dark:text-rose-300">
            <span className="inline-flex items-center gap-1.5">
              {money(balance)}{" "}
              <CurrencyFlagIcon currency={currencyCode} className="h-4 w-6" />
              <span className="sr-only">{currencyCode}</span>
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2 sm:justify-end">
          <button
            type="button"
            className="border border-light-border px-3 py-2 text-xs font-semibold hover:border-primary-500 dark:border-dark-border"
            onClick={() =>
              form.setValue("paidAmount", total, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          >
            {t("admin.purchases.form.payFull")}
          </button>
          <button
            type="button"
            className="border border-light-border px-3 py-2 text-xs font-semibold hover:border-primary-500 dark:border-dark-border"
            onClick={() =>
              form.setValue("paidAmount", 0, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          >
            {t("admin.purchases.form.payLater")}
          </button>
        </div>
      </div>

      <section className="order-2 space-y-3 border border-light-border p-3 dark:border-dark-border">
        <div className="grid items-end gap-2 lg:grid-cols-[minmax(14rem,1.4fr)_minmax(10rem,1fr)_6rem_minmax(13rem,1.1fr)_7rem_auto]">
          <SelectField
            label={t("admin.purchases.column.product")}
            options={productOptions}
            value={draftLine.productId}
            onValueChange={(value) => void selectProduct(value)}
            tone="light"
            searchable
            clearable={false}
            contentClassName="z-[1200]"
          />
          <SelectField
            label={t("admin.purchases.column.location")}
            options={locationOptions}
            value={draftLine.locationId}
            onValueChange={(value) => updateDraftLine({ locationId: value })}
            tone="light"
            searchable
            clearable={false}
            contentClassName="z-[1200]"
          />
          <InputField
            label={t("admin.purchases.column.quantity")}
            type="number"
            min={0}
            step="0.01"
            value={draftLine.quantity}
            onChange={(event) =>
              updateDraftLine({ quantity: Number(event.target.value) })
            }
            tone="light"
          />
          <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-end gap-0">
            <SelectField
              label={t("admin.purchases.column.currency")}
              options={currencyOptions}
              value={draftLine.sourceCurrency || currencyCode}
              onValueChange={(value) => void changeLineCurrency(value)}
              tone="light"
              clearable={false}
              contentClassName="z-[1200]"
            />
            <InputField
              label={t("admin.purchases.column.unitCost")}
              type="number"
              min={0}
              step="0.01"
              value={draftLine.sourceUnitCost}
              onChange={(event) =>
                changeSourceUnitCost(Number(event.target.value))
              }
              tone="light"
            />
          </div>
          <InputField
            label={t("admin.purchases.column.discount")}
            type="number"
            min={0}
            step="0.01"
            value={draftLine.discount}
            onChange={(event) =>
              updateDraftLine({ discount: Number(event.target.value) })
            }
            tone="light"
          />
          <button
            type="button"
            className="inline-flex min-h-10 items-center py-3 bg-primary-500 text-white justify-center gap-2 border border-light-border px-3 text-sm font-semibold hover:border-primary-500 dark:border-dark-border"
            onClick={(event) => addLine(event)}
          >
            <Plus className="size-4" />
            {t("admin.purchases.form.addLine")}
          </button>
        </div>

        <div className="overflow-x-auto border border-light-border dark:border-dark-border">
          <table className="min-w-full text-sm">
            <thead className="bg-light-bg text-xs uppercase tracking-[0.14em] text-muted dark:bg-dark-bg">
              <tr>
                <th className="px-3 py-2 text-start">
                  {t("admin.purchases.column.product")}
                </th>
                <th className="px-3 py-2 text-start">
                  {t("admin.purchases.column.location")}
                </th>
                <th className="px-3 py-2 text-end">
                  {t("admin.purchases.column.quantity")}
                </th>
                <th className="px-3 py-2 text-end">
                  {t("admin.purchases.column.unitCost")}
                </th>
                <th className="px-3 py-2 text-end">
                  {t("admin.purchases.column.discount")}
                </th>
                <th className="px-3 py-2 text-end">
                  {t("admin.purchases.column.total")}
                </th>
                <th className="px-3 py-2 text-center">
                  {t("admin.purchases.column.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {watchedLines.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-6 text-center text-sm text-muted"
                  >
                    {form.formState.errors.lines?.message ??
                      t("admin.purchases.validation.lineRequired")}
                  </td>
                </tr>
              ) : (
                watchedLines.map((line, index) => {
                  const product = productById.get(line.productId);
                  const location = locations.find(
                    (item) => item.id === line.locationId,
                  );
                  const lineTotal =
                    Number(line.quantity || 0) * Number(line.unitCost || 0) -
                    Number(line.discount || 0);
                  return (
                    <tr
                      key={lines.fields[index]?.id ?? index}
                      className="border-t border-light-border dark:border-dark-border"
                    >
                      <td className="px-3 py-2 font-medium">
                        {product ? `${product.sku} - ${product.name}` : "-"}
                      </td>
                      <td className="px-3 py-2">{location?.name ?? "-"}</td>
                      <td className="px-3 py-2 text-end">{line.quantity}</td>
                      <td className="px-3 py-2 text-end">
                        <span className="inline-flex items-center gap-1.5">
                          {money(Number(line.unitCost))}{" "}
                          <CurrencyFlagIcon
                            currency={currencyCode}
                            className="h-4 w-6"
                          />
                          <span className="sr-only">{currencyCode}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 text-end">
                        {money(Number(line.discount))}
                      </td>
                      <td className="px-3 py-2 text-end font-semibold">
                        {money(lineTotal)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          className="inline-flex size-8 items-center justify-center border border-light-border text-muted hover:border-red-500 hover:text-red-600 dark:border-dark-border"
                          onClick={() => lines.remove(index)}
                          aria-label={t("admin.purchases.form.removeLine")}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap justify-end gap-4 border-t border-light-border pt-3 text-sm dark:border-dark-border">
          <span>
            {t("admin.purchases.column.subtotal")}:{" "}
            <strong>{money(subtotal)}</strong>
          </span>
          <span>
            {t("admin.purchases.column.total")}: <strong>{money(total)}</strong>
          </span>
          <span>
            {t("admin.purchases.column.balance")}:{" "}
            <strong>{money(balance)}</strong>
          </span>
        </div>
      </section>
      <div className="order-5">
        <FormTextareaField
          control={form.control}
          name="notes"
          label={t("admin.purchases.column.notes")}
          tone="light"
          rows={3}
        />
      </div>
    </FormModal>
  );
}

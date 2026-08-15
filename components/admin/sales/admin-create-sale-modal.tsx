"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ReceiptText, Trash2 } from "lucide-react";
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
  useCreateAdminSaleMutation,
  useUpdateAdminSaleMutation,
} from "@/lib/query/hooks";
import {
  adminSaleDefaultValues,
  createAdminSaleSchema,
  type AdminSaleFormValues,
} from "@/lib/validation/admin-sale-schemas";
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
import type { SaleRow } from "@/services/sales.service";

type Props = {
  accounts: AccountRow[];
  customers: PartnerRow[];
  locations: InventoryLocationRow[];
  open: boolean;
  preselectedCustomerId?: string | null;
  products: ProductRow[];
  sale?: SaleRow | null;
  onClose: () => void;
};

type DraftLine = {
  productId: string;
  locationId: string;
  quantity: number;
  sourceUnitPrice: number;
  sourceCurrency: CurrencyCode | "";
  conversionRate: number;
  unitPrice: number;
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
  sourceUnitPrice: 0,
  sourceCurrency: "",
  conversionRate: 1,
  unitPrice: 0,
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

const WALK_IN_CUSTOMER_ID = "__walk_in__";

function money(value: number) {
  return Number(value || 0).toLocaleString();
}

function buildEmptyLine(locationId = ""): DraftLine {
  return {
    ...emptyLine,
    locationId,
  };
}

export function AdminCreateSaleModal({
  accounts,
  customers,
  locations,
  open,
  preselectedCustomerId = null,
  products,
  sale = null,
  onClose,
}: Props) {
  const { language, t } = useI18n();
  const createMutation = useCreateAdminSaleMutation();
  const updateMutation = useUpdateAdminSaleMutation();
  const currenciesQuery = useAdminCurrenciesQuery();
  const schema = useMemo(() => createAdminSaleSchema(t), [t]);
  const [draftLine, setDraftLine] = useState<DraftLine>(emptyLine);
  const [, setConversionNote] = useState<string | null>(null);
  const [pricingBridge, setPricingBridge] = useState<PricingBridge | null>(
    null,
  );
  const isEdit = Boolean(sale);
  const submitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<AdminSaleFormValues>({
    resolver: zodResolver(schema) as Resolver<AdminSaleFormValues>,
    defaultValues: adminSaleDefaultValues,
    mode: "onTouched",
  });
  const lines = useFieldArray({ control: form.control, name: "lines" });
  const currencyCode = form.watch("currencyCode");
  const watchedLines = form.watch("lines");
  const taxTotal = Number(form.watch("taxTotal") ?? 0);
  const receivedAmount = Number(form.watch("receivedAmount") ?? 0);
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
      unitPrice: current.sourceUnitPrice * rate,
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
    if (sale) {
      form.reset({
        customerId:
          sale.customer?.code === "CUS-WALKIN"
            ? WALK_IN_CUSTOMER_ID
            : sale.customerId,
        invoiceDate: sale.invoiceDate?.slice(0, 10) ?? getLocalDateString(),
        dueDate: sale.dueDate?.slice(0, 10) ?? "",
        currencyCode: sale.currencyCode,
        exchangeRateToBase: 1,
        revenueAccountId: "",
        inventoryAccountId: "",
        cogsAccountId: "",
        taxTotal: Number(sale.taxTotal ?? 0),
        receiptAccountId: "",
        receivedAmount: Number(sale.paidTotal ?? 0),
        notes: sale.notes ?? "",
        lines: (sale.lines ?? []).map((line) => ({
          productId: line.productId,
          locationId: line.locationId,
          description: line.description ?? "",
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
          unitCost:
            Number(line.costTotal) / Math.max(Number(line.quantity) || 1, 1),
          discount: Number(line.discount),
        })),
      });
    } else {
      form.reset({
        ...adminSaleDefaultValues,
        customerId: preselectedCustomerId ?? "",
      });
    }
    setDraftLine(buildEmptyLine(defaultLocationId));
  }, [defaultLocationId, form, open, preselectedCustomerId, sale]);

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const customerOptions = useMemo<SelectOption[]>(
    () => [
      {
        value: WALK_IN_CUSTOMER_ID,
        label: "One-time customer",
        description: "Walk-in sale without registration",
      },
      ...customers.map((customer) => ({
        value: customer.id,
        label: `${customer.code} - ${customer.name}`,
        description: customer.type,
      })),
    ],
    [customers],
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
            description: `${money(stock)} ${product.baseUnit?.code ?? "unit"} · default ${money(Number(product.defaultSalePrice))} ${product.preferredSaleCurrency}`,
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
  const receiptAccountById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );
  const receiptAccountOptions = useMemo<SelectOption[]>(
    () => buildAssetAccountOptions(accounts, currencyCode, language),
    [accounts, currencyCode, language],
  );
  function stockToneClass(stock: number) {
    return stock > 0
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
      : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300";
  }

  const subtotal = watchedLines.reduce(
    (sum, line) =>
      sum +
      Number(line.quantity || 0) * Number(line.unitPrice || 0) -
      Number(line.discount || 0),
    0,
  );
  const total = subtotal + taxTotal;
  const balance = Math.max(total - receivedAmount, 0);

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
      form.getValues("invoiceDate"),
    );
    return {
      amount: amount * Number(conversion.rate),
      rate: Number(conversion.rate),
    };
  }

  async function selectProduct(value: string) {
    const product = productById.get(value);
    if (!product) return;
    const sourceCurrency = product.preferredSaleCurrency;
    const sourcePrice = Number(product.defaultSalePrice ?? 0);
    try {
      const converted = await convertedAmount(
        sourcePrice,
        sourceCurrency,
        currencyCode,
      );
      form.setValue("exchangeRateToBase", converted.rate, {
        shouldDirty: true,
        shouldValidate: true,
      });
      updateDraftLine({
        productId: value,
        sourceUnitPrice: sourcePrice,
        sourceCurrency,
        conversionRate: converted.rate,
        unitPrice: converted.amount,
      });
      setPricingBridge({
        sourceCurrency,
        productToDocumentRate: converted.rate,
      });
      setConversionNote(
        sourceCurrency === currencyCode
          ? null
          : `${money(sourcePrice)} ${sourceCurrency} × ${converted.rate.toLocaleString()} = ${money(converted.amount)} ${currencyCode}`,
      );
    } catch {
      form.setValue("exchangeRateToBase", 1, {
        shouldDirty: true,
        shouldValidate: true,
      });
      updateDraftLine({
        productId: value,
        sourceUnitPrice: sourcePrice,
        sourceCurrency,
        conversionRate: 1,
        unitPrice: sourcePrice,
      });
      setPricingBridge({ sourceCurrency, productToDocumentRate: 1 });
      setConversionNote(
        `${money(sourcePrice)} ${sourceCurrency}. Enter how many ${currencyCode} equal 1 ${sourceCurrency}.`,
      );
    }
  }

  async function changeLineCurrency(value: string) {
    const nextCurrency = value as CurrencyCode;
    try {
      const converted = await convertedAmount(
        draftLine.sourceUnitPrice,
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
        unitPrice: converted.amount,
      });
      setPricingBridge({
        sourceCurrency: nextCurrency,
        productToDocumentRate: converted.rate,
      });
    } catch (error) {
      gooeyToast.error(
        error instanceof ApiError
          ? error.message
          : "Unable to convert the line price.",
      );
    }
  }

  function changeSourceUnitPrice(value: number) {
    updateDraftLine({
      sourceUnitPrice: value,
      unitPrice: value * draftLine.conversionRate,
    });
  }

  async function changeCurrency(value: string) {
    const nextCurrency = value as CurrencyCode;
    const previousCurrency = currencyCode as CurrencyCode;
    if (nextCurrency === previousCurrency) return;
    const currentLines = form.getValues("lines");
    if (currentLines.length === 0) {
      fieldCurrencyUpdate(nextCurrency);
      setDraftLine(buildEmptyLine(defaultLocationId));
      setConversionNote(null);
      setPricingBridge(null);
      return;
    }
    try {
      const conversion = await fetchConversionRate(
        previousCurrency,
        nextCurrency,
        form.getValues("invoiceDate"),
      );
      const rate = Number(conversion.rate);
      form.setValue(
        "lines",
        form.getValues("lines").map((line) => ({
          ...line,
          unitPrice: Number(line.unitPrice) * rate,
          discount: Number(line.discount) * rate,
        })),
        { shouldDirty: true, shouldValidate: true },
      );
      form.setValue("taxTotal", Number(form.getValues("taxTotal")) * rate);
      form.setValue(
        "receivedAmount",
        Number(form.getValues("receivedAmount")) * rate,
      );
      fieldCurrencyUpdate(nextCurrency);
      setDraftLine(buildEmptyLine(defaultLocationId));
      setConversionNote(
        `${previousCurrency} × ${rate.toLocaleString()} = ${nextCurrency}`,
      );
    } catch (error) {
      fieldCurrencyUpdate(nextCurrency);
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

  function fieldCurrencyUpdate(value: CurrencyCode) {
    form.setValue("currencyCode", value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function addLine(event?: MouseEvent<HTMLButtonElement>) {
    event?.preventDefault();
    event?.stopPropagation();

    const product = productById.get(draftLine.productId);
    if (!draftLine.productId || !product) {
      gooeyToast.error(t("admin.sales.validation.productRequired"));
      return;
    }

    if (!draftLine.locationId) {
      gooeyToast.error(t("admin.sales.validation.locationRequired"));
      return;
    }

    if (draftLine.quantity <= 0) {
      gooeyToast.error(t("admin.sales.validation.positiveNumber"));
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
      Number(draftLine.quantity) * Number(draftLine.unitPrice) -
      Number(draftLine.discount);
    const shouldDefaultToFullPayment =
      watchedLines.length === 0 ||
      Math.round(receivedAmount * 100) === Math.round(total * 100);

    lines.append({
      productId: draftLine.productId,
      locationId: draftLine.locationId,
      description: `${draftLine.quantity} × ${product.sku} - ${product.name} (${form.getValues("invoiceDate")})`,
      quantity: Number(draftLine.quantity),
      unitPrice: Number(draftLine.unitPrice),
      unitCost: Number(product.standardCost ?? 0),
      discount: Number(draftLine.discount),
    });
    if (shouldDefaultToFullPayment) {
      form.setValue("receivedAmount", total + newLineTotal, {
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
              values.invoiceDate,
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
                    values.invoiceDate,
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
        productCurrencyCode: pricingBridge?.sourceCurrency,
        productExchangeRate:
          pricingBridge && pricingBridge.productToDocumentRate > 0
            ? pricingBridge.productToDocumentRate
            : 1,
      };
      if (isEdit && sale) {
        const updated = await updateMutation.mutateAsync({
          id: sale.id,
          input: accountingValues,
        });
        gooeyToast.success(t("admin.sales.edit.successTitle"), {
          description: t("admin.sales.edit.successDescription", {
            number: updated.number,
          }),
        });
      } else {
        const created = await createMutation.mutateAsync(accountingValues);
        gooeyToast.success(t("admin.sales.create.successTitle"), {
          description: t("admin.sales.create.successDescription", {
            number: created.number,
          }),
        });
      }
      onClose();
    } catch (error) {
      gooeyToast.error(
        isEdit
          ? t("admin.sales.edit.errorTitle")
          : t("admin.sales.create.errorTitle"),
        {
          description:
            error instanceof ApiError
              ? error.message
              : isEdit
                ? t("admin.sales.edit.errorFallback")
                : t("admin.sales.create.errorFallback"),
        },
      );
    }
  });

  return (
    <FormModal
      open={open}
      title={
        isEdit ? t("admin.sales.edit.title") : t("admin.sales.create.title")
      }
      description={
        isEdit && sale
          ? t("admin.sales.edit.description", { number: sale.number })
          : t("admin.sales.create.description")
      }
      submitLabel={
        isEdit ? t("admin.sales.edit.submit") : t("admin.sales.create.submit")
      }
      submittingLabel={
        isEdit
          ? t("admin.sales.edit.submitting")
          : t("admin.sales.create.submitting")
      }
      cancelLabel={t("admin.sales.create.cancel")}
      closeLabel={t("admin.sales.create.close")}
      submitting={submitting}
      onClose={() => {
        if (!submitting) onClose();
      }}
      onSubmit={() => void submit()}
      panelClassName="!max-h-[92vh] max-w-[min(96vw,78rem)]"
      contentClassName="gap-1 !flex flex-col"
    >
      <div className="order-1 grid gap-3 border border-light-border bg-light-bg/40 p-3 dark:border-dark-border dark:bg-dark-bg/30 md:grid-cols-2">
        <Controller
          control={form.control}
          name="currencyCode"
          render={({ field }) => (
            <SelectField
              label={t("admin.sales.column.currency")}
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

      <div className="order-3 grid gap-3 rounded-sm border border-light-border bg-light-bg/35 p-3 dark:border-dark-border dark:bg-dark-bg/25 md:grid-cols-2 xl:grid-cols-2">
        <Controller
          control={form.control}
          name="customerId"
          render={({ field, fieldState }) => (
            <SelectField
              label={t("admin.sales.column.customer")}
              options={customerOptions}
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
          name="invoiceDate"
          label={t("admin.sales.form.invoiceDate")}
          tone="light"
        />
        <FormDatePickerField
          control={form.control}
          name="dueDate"
          label={t("admin.sales.form.dueDate")}
          tone="light"
        />
        <FormInputField
          control={form.control}
          name="taxTotal"
          type="number"
          min={0}
          step="0.01"
          label={t("admin.sales.column.tax")}
          tone="light"
        />
        <FormInputField
          control={form.control}
          name="receivedAmount"
          type="number"
          min={0}
          step="0.01"
          label={t("admin.sales.column.paid")}
          startIcon={<ReceiptText className="size-4" />}
          tone="light"
        />

        <Controller
          control={form.control}
          name="receiptAccountId"
          render={({ field, fieldState }) => (
            <SelectField
              label={t("admin.sales.form.receiptAccount")}
              options={receiptAccountOptions}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              renderOption={(option) =>
                renderAssetAccountOption(
                  option,
                  receiptAccountById,
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
        <div className="border border-light-border bg-light-bg/40 p-3 text-sm text-muted dark:border-dark-border dark:bg-dark-bg/30 md:col-span-2">
          {t("admin.sales.form.accountingNote")}
        </div>
      </div>

      <div className="order-4 grid gap-2 rounded-sm border border-light-border bg-light-bg/40 p-3 text-sm dark:border-dark-border dark:bg-dark-bg/30 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t("admin.sales.form.receivedAmount")}
          </p>
          <p className="mt-1 font-semibold">
            <span className="inline-flex items-center gap-1.5">
              {money(receivedAmount)}{" "}
              <CurrencyFlagIcon currency={currencyCode} className="h-4 w-6" />
              <span className="sr-only">{currencyCode}</span>
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t("admin.sales.column.balance")}
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
              form.setValue("receivedAmount", total, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          >
            {t("admin.sales.form.receiveFull")}
          </button>
          <button
            type="button"
            className="border border-light-border px-3 py-2 text-xs font-semibold hover:border-primary-500 dark:border-dark-border"
            onClick={() =>
              form.setValue("receivedAmount", 0, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          >
            {t("admin.sales.form.receiveLater")}
          </button>
        </div>
      </div>

      <section className="order-2 space-y-3 rounded-sm border border-light-border bg-light-surface p-3 dark:border-dark-border dark:bg-dark-surface">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            {t("admin.sales.form.lines")}
          </p>
          <p className="text-xs text-muted">
            {watchedLines.length} {t("admin.sales.form.lines")}
          </p>
        </div>

        <div className="grid items-end gap-2 md:grid-cols-2 xl:grid-cols-[minmax(14rem,1.35fr)_minmax(10rem,1fr)_6rem_minmax(13rem,1.1fr)_7rem_auto]">
          <SelectField
            label={t("admin.sales.column.product")}
            options={productOptions}
            value={draftLine.productId}
            onValueChange={(value) => void selectProduct(value)}
            tone="light"
            searchable
            clearable={false}
            renderOption={(option) => {
              const product = productById.get(option.value);
              const stock = (product?.inventoryBalances ?? []).reduce(
                (sum, balance) => sum + Number(balance.quantityOnHand ?? 0),
                0,
              );
              return (
                <span className="flex min-w-0 items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    <span className="block text-xs text-light-muted dark:text-dark-muted">
                      {option.description}
                    </span>
                  </span>
                  <span
                    dir="ltr"
                    className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-semibold [unicode-bidi:isolate] ${stockToneClass(stock)}`}
                  >
                    {money(stock)} {product?.baseUnit?.code ?? "unit"}
                  </span>
                </span>
              );
            }}
            contentClassName="z-[1200]"
          />
          <SelectField
            label={t("admin.sales.column.location")}
            options={locationOptions}
            value={draftLine.locationId}
            onValueChange={(value) => updateDraftLine({ locationId: value })}
            tone="light"
            searchable
            clearable={false}
            contentClassName="z-[1200]"
          />
          <InputField
            label={t("admin.sales.column.quantity")}
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
              label={t("admin.sales.column.currency")}
              options={currencyOptions}
              value={draftLine.sourceCurrency || currencyCode}
              onValueChange={(value) => void changeLineCurrency(value)}
              tone="light"
              clearable={false}
              contentClassName="z-[1200]"
            />
            <InputField
              label={t("admin.sales.column.unitPrice")}
              type="number"
              min={0}
              step="0.01"
              value={draftLine.sourceUnitPrice}
              onChange={(event) =>
                changeSourceUnitPrice(Number(event.target.value))
              }
              tone="light"
            />
          </div>
          <InputField
            label={t("admin.sales.column.discount")}
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
            className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap border border-light-border py-1 bg-primary-500  text-white px-3 text-sm font-semibold hover:border-primary-500 dark:border-dark-border md:col-span-2 xl:col-span-1"
            onClick={(event) => addLine(event)}
          >
            <Plus className="size-4" />
            {t("admin.sales.form.addLine")}
          </button>
        </div>

        <div className="overflow-auto border border-light-border dark:border-dark-border">
          <table className="text-sm w-full ">
            <thead className="bg-light-bg text-xs uppercase tracking-[0.14em] text-muted dark:bg-dark-bg">
              <tr>
                <th className="px-3 py-2 text-start">
                  {t("admin.sales.column.product")}
                </th>
                <th className="px-3 py-2 text-start">
                  {t("admin.sales.column.location")}
                </th>
                <th className="px-3 py-2 text-end">
                  {t("admin.sales.column.quantity")}
                </th>
                <th className="px-3 py-2 text-end">
                  {t("admin.sales.column.unitPrice")}
                </th>
                <th className="px-3 py-2 text-end">
                  {t("admin.sales.column.discount")}
                </th>
                <th className="px-3 py-2 text-end">
                  {t("admin.sales.column.total")}
                </th>
                <th className="px-3 py-2 text-center">
                  {t("admin.sales.column.actions")}
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
                      t("admin.sales.validation.lineRequired")}
                  </td>
                </tr>
              ) : (
                watchedLines.map((line, index) => {
                  const product = productById.get(line.productId);
                  const location = locations.find(
                    (item) => item.id === line.locationId,
                  );
                  const lineTotal =
                    Number(line.quantity || 0) * Number(line.unitPrice || 0) -
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
                          {money(Number(line.unitPrice))}{" "}
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
                        <span className="inline-flex items-center gap-1.5">
                          {money(lineTotal)}
                          <CurrencyFlagIcon
                            currency={currencyCode}
                            className="h-4 w-6"
                          />
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          className="inline-flex size-8 items-center justify-center border border-light-border text-muted hover:border-red-500 hover:text-red-600 dark:border-dark-border"
                          onClick={() => lines.remove(index)}
                          aria-label={t("admin.sales.form.removeLine")}
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
            {t("admin.sales.column.subtotal")}:{" "}
            <strong>{money(subtotal)}</strong>
          </span>
          <span>
            {t("admin.sales.column.total")}: <strong>{money(total)}</strong>
          </span>
          <span>
            {t("admin.sales.column.balance")}: <strong>{money(balance)}</strong>
          </span>
        </div>
      </section>
      <div className="order-5">
        <FormTextareaField
          control={form.control}
          name="notes"
          label={t("admin.sales.column.notes")}
          tone="light"
          rows={3}
        />
      </div>
    </FormModal>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import {
  ArrowDownToLine,
  ArrowRightLeft,
  ArrowUpFromLine,
  Boxes,
  Eye,
  History,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { gooeyToast } from "goey-toast";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import {
  FormDatePickerField,
  FormInputField,
  FormTextareaField,
} from "@/components/common";
import { ConfirmModal } from "@/components/common/confirm-modal";
import DataTableEmptyState from "@/components/common/data-table-empty-state";
import { FormModal } from "@/components/common/form-modal";
import { InputField } from "@/components/common/input-field";
import {
  SelectField,
  type SelectOption,
} from "@/components/common/select-field";
import Table from "@/components/common/table";
import TableBody from "@/components/common/table-body";
import TableColumn from "@/components/common/table-column";
import TableHeader from "@/components/common/table-header";
import TableRow from "@/components/common/table-row";
import TableRowActionsMenu from "@/components/common/table-row-actions-menu";
import TableToolbar from "@/components/common/table-tool-bar";
import {
  TableToolbarIcon,
  tableToolbarIconClass,
} from "@/components/common/table-toolbar-icons";
import { useAuth } from "@/hooks/use-auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/api";
import { getLocalDateString } from "@/lib/date-format";
import { useI18n } from "@/lib/i18n";
import { useCreateAdminInventoryTransferMutation } from "@/lib/query/hooks";
import type { BalanceRow } from "@/services/reports-admin.service";
import type {
  InventoryLocationRow,
  ProductRow,
} from "@/services/products.service";

type Props = {
  balances: BalanceRow[];
  loading?: boolean;
  locations: InventoryLocationRow[];
  locationFilterId?: string;
  products: ProductRow[];
  refreshing?: boolean;
  onRefresh: () => void;
};

type TransferValues = {
  movedAt: string;
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  notes: string;
};

const defaultValues: TransferValues = {
  movedAt: getLocalDateString(),
  productId: "",
  fromLocationId: "",
  toLocationId: "",
  quantity: 1,
  notes: "",
};

const schema = z
  .object({
    movedAt: z.string().trim().min(1),
    productId: z.string().trim().min(1),
    fromLocationId: z.string().trim().min(1),
    toLocationId: z.string().trim().min(1),
    quantity: z.coerce.number().positive(),
    notes: z.string().trim().optional(),
  })
  .refine((data) => data.fromLocationId !== data.toLocationId, {
    path: ["toLocationId"],
  });

function numberLabel(value: string | number | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed.toLocaleString() : "0";
}

function locationLabel(
  location?: { code?: string; name?: string; type?: string } | null,
) {
  if (!location) return "-";
  return `${location.code ?? ""} - ${location.name ?? ""}`.trim();
}

function dateLabel(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function reservedQuantity(row: BalanceRow) {
  return Number(
    (row as BalanceRow & { reservedQuantity?: number | string })
      .reservedQuantity ?? 0,
  );
}

function lastMovementDate(row: BalanceRow) {
  return (row as BalanceRow & { lastMovementDate?: string | null })
    .lastMovementDate;
}

function inventoryValue(row: BalanceRow) {
  const explicit = (row as BalanceRow & { inventoryValue?: number | string })
    .inventoryValue;
  return (
    explicit ?? Number(row.quantityOnHand ?? 0) * Number(row.averageCost ?? 0)
  );
}

function currentQuantity(row?: BalanceRow) {
  return Number(row?.quantityOnHand ?? 0);
}

function availableQuantityForRow(row?: BalanceRow) {
  return Math.max(0, currentQuantity(row) - (row ? reservedQuantity(row) : 0));
}

function transferReferenceLabel(user?: {
  fullName?: string;
  name?: string;
  username?: string | null;
}) {
  const actor = user?.fullName ?? user?.name ?? user?.username ?? "admin";
  return `stock-transfer:${actor}`;
}

function quantityToneClass(quantity: number, reorderLevel?: number) {
  if (quantity <= 0)
    return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400";
  if (reorderLevel && quantity <= reorderLevel)
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
}

export function AdminInventoryStockTable({
  balances,
  loading = false,
  locations,
  locationFilterId,
  products,
  refreshing = false,
  onRefresh,
}: Props) {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const detailsBasePath = pathname.startsWith("/dashboard")
    ? "/dashboard/products/inventory"
    : "/admin/products/inventory";
  const [search, setSearch] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState(
    locationFilterId ?? "all",
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [stockDeleteTarget, setStockDeleteTarget] = useState<BalanceRow | null>(
    null,
  );
  const debouncedSearch = useDebouncedValue(search, 300);
  const transferMutation = useCreateAdminInventoryTransferMutation();
  const form = useForm<TransferValues>({
    resolver: zodResolver(schema) as Resolver<TransferValues>,
    defaultValues,
    mode: "onTouched",
  });

  useEffect(() => {
    setSelectedLocationId(locationFilterId ?? "all");
  }, [locationFilterId]);
  const productId = form.watch("productId");
  const fromLocationId = form.watch("fromLocationId");
  const selectedBalance = useMemo(
    () =>
      balances.find(
        (row) =>
          row.product?.id === productId && row.location?.id === fromLocationId,
      ),
    [balances, fromLocationId, productId],
  );
  const currentStockQuantity = currentQuantity(selectedBalance);
  const availableQuantity = availableQuantityForRow(selectedBalance);
  const productMetaById = useMemo(
    () =>
      new Map(
        products.map((product) => [
          product.id,
          {
            sku: product.sku,
            categoryName: product.category?.name ?? "-",
            baseUnitCode:
              product.baseUnit?.code ?? product.baseUnit?.name ?? "",
            reorderLevel: Number(product.reorderLevel ?? 0),
          },
        ]),
      ),
    [products],
  );

  const positiveStockRows = useMemo(
    () => balances.filter((row) => availableQuantityForRow(row) > 0),
    [balances],
  );

  const productOptions = useMemo<SelectOption[]>(
    () =>
      products
        .filter((product) => {
          if (!product.isActive) return false;
          return positiveStockRows.some((row) => {
            if (row.product?.id !== product.id) return false;
            if (fromLocationId && row.location?.id !== fromLocationId)
              return false;
            return availableQuantityForRow(row) > 0;
          });
        })
        .map((product) => ({
          value: product.id,
          label: `${product.sku} - ${product.name}`,
        })),
    [fromLocationId, positiveStockRows, products],
  );
  const fromLocationOptions = useMemo<SelectOption[]>(
    () =>
      locations
        .filter((location) => {
          if (!productId) {
            return positiveStockRows.some(
              (row) =>
                row.location?.id === location.id &&
                availableQuantityForRow(row) > 0,
            );
          }
          return positiveStockRows.some(
            (row) =>
              row.product?.id === productId &&
              row.location?.id === location.id &&
              availableQuantityForRow(row) > 0,
          );
        })
        .map((location) => ({
          value: location.id,
          label: `${location.code} - ${location.name}`,
          description: t(
            `admin.products.location.type.${location.type === "in_transit" ? "inTransit" : location.type}` as never,
          ),
        })),
    [locations, positiveStockRows, productId, t],
  );
  const toLocationOptions = useMemo<SelectOption[]>(
    () =>
      locations
        .filter((location) => location.id !== fromLocationId)
        .map((location) => ({
          value: location.id,
          label: `${location.code} - ${location.name}`,
          description: t(
            `admin.products.location.type.${location.type === "in_transit" ? "inTransit" : location.type}` as never,
          ),
        })),
    [fromLocationId, locations, t],
  );
  const locationFilterOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: t("admin.products.stock.allLocations") },
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
  const filteredBalances = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return balances.filter((row) => {
      if (
        selectedLocationId !== "all" &&
        row.location?.id !== selectedLocationId
      ) {
        return false;
      }
      if (!query) return true;
      return [
        row.product?.sku,
        row.product?.name,
        row.location?.code,
        row.location?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [balances, debouncedSearch, selectedLocationId]);

  const submit = form.handleSubmit(async (values) => {
    if (Number(values.quantity) > availableQuantity) {
      form.setError("quantity", {
        message: t("admin.products.stock.validation.notEnough"),
      });
      return;
    }

    try {
      const movement = await transferMutation.mutateAsync({
        ...values,
        reference: transferReferenceLabel(user ?? undefined),
      });
      gooeyToast.success(t("admin.products.stock.transferSuccessTitle"), {
        description: t("admin.products.stock.transferSuccessDescription", {
          number: movement.number,
        }),
      });
      setModalOpen(false);
      form.reset(defaultValues);
    } catch (error) {
      gooeyToast.error(t("admin.products.stock.transferFailedTitle"), {
        description:
          error instanceof ApiError
            ? error.message
            : t("admin.products.stock.transferFailedFallback"),
      });
    }
  });

  const openTransferModal = (row?: BalanceRow) => {
    form.reset(
      row?.product?.id && row.location?.id
        ? {
            ...defaultValues,
            productId: row.product.id,
            fromLocationId: row.location.id,
          }
        : defaultValues,
    );
    setModalOpen(true);
  };

  const headerData = [
    { title: t("admin.products.column.product") },
    { title: t("admin.products.location.name") },
    {
      title: t("admin.products.inventory.quantityAvailable"),
      align: "end" as const,
    },
    { title: t("admin.products.inventory.reserved"), align: "end" as const },
    { title: t("admin.products.inventory.available"), align: "end" as const },
    {
      title: t("admin.products.inventory.inventoryValue"),
      align: "end" as const,
    },
    { title: t("admin.products.inventory.lastMovement") },
    { title: t("admin.products.column.actions"), align: "center" as const },
  ];

  if (loading) {
    return (
      <div className="border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
        <div className="h-36 animate-pulse bg-light-border dark:bg-dark-border" />
      </div>
    );
  }

  return (
    <>
      <ConfirmModal
        open={stockDeleteTarget != null}
        title={t("admin.products.stock.deleteUnavailableTitle")}
        description={t("admin.products.stock.deleteUnavailableDescription", {
          name: stockDeleteTarget?.product?.name ?? "",
        })}
        confirmLabel={t("admin.products.stock.deleteUnavailableConfirm")}
        cancelLabel={t("admin.products.stock.deleteUnavailableCancel")}
        closeLabel={t("admin.products.stock.deleteUnavailableClose")}
        onClose={() => setStockDeleteTarget(null)}
        onConfirm={() => setStockDeleteTarget(null)}
      />
      <FormModal
        open={modalOpen}
        title={t("admin.products.stock.transferTitle")}
        description={t("admin.products.stock.transferDescription")}
        submitLabel={t("admin.products.stock.transferSubmit")}
        submittingLabel={t("admin.products.stock.transferSubmitting")}
        cancelLabel={t("admin.products.stock.transferCancel")}
        closeLabel={t("admin.products.stock.transferCancel")}
        submitting={transferMutation.isPending}
        onClose={() => {
          if (!transferMutation.isPending) setModalOpen(false);
        }}
        onSubmit={() => void submit()}
        panelClassName="max-w-3xl"
      >
        <FormDatePickerField
          control={form.control}
          name="movedAt"
          label={t("admin.products.stock.movedAt")}
          tone="light"
        />
        <Controller
          control={form.control}
          name="productId"
          render={({ field, fieldState }) => (
            <SelectField
              label={t("admin.products.column.product")}
              options={productOptions}
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                form.setValue("fromLocationId", "");
                form.setValue("toLocationId", "");
                form.setValue("quantity", 1);
              }}
              error={fieldState.error?.message}
              tone="light"
              searchable
              clearable={false}
              contentClassName="z-[1200]"
            />
          )}
        />
        <Controller
          control={form.control}
          name="fromLocationId"
          render={({ field, fieldState }) => (
            <SelectField
              label={t("admin.products.stock.fromLocation")}
              options={fromLocationOptions}
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                form.setValue("toLocationId", "");
                form.setValue("quantity", 1);
              }}
              error={fieldState.error?.message}
              tone="light"
              searchable
              clearable={false}
              contentClassName="z-[1200]"
            />
          )}
        />
        <Controller
          control={form.control}
          name="toLocationId"
          render={({ field, fieldState }) => (
            <SelectField
              label={t("admin.products.stock.toLocation")}
              options={toLocationOptions}
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
        <FormInputField
          control={form.control}
          name="quantity"
          type="number"
          min={0}
          max={availableQuantity || undefined}
          step="0.001"
          label={t("admin.products.stock.quantity")}
          tone="light"
        />
        <div className="flex flex-col justify-end gap-1 text-xs text-muted">
          <span>
            {t("admin.products.stock.current", {
              quantity: numberLabel(currentStockQuantity),
            })}
          </span>
          <span>
            {t("admin.products.stock.available", {
              quantity: numberLabel(availableQuantity),
            })}
          </span>
          <span>{t("admin.products.stock.referenceAuto")}</span>
        </div>
        <FormTextareaField
          control={form.control}
          name="notes"
          label={t("admin.products.stock.notes")}
          tone="light"
          rows={3}
          containerClassName="sm:col-span-2"
        />
      </FormModal>

      <div className="overflow-hidden border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <Table
          toolbar={
            <TableToolbar>
              <TableToolbar.Row justify="between">
                <TableToolbar.Section>
                  <Boxes className="size-4 text-light-muted dark:text-dark-muted" />
                  <span className="text-xs font-semibold text-light-muted dark:text-dark-muted">
                    {t("admin.products.stock.count", {
                      count: filteredBalances.length,
                    })}
                  </span>
                  <TableToolbar.IconButton
                    iconOnly
                    icon={
                      <TableToolbarIcon
                        icon={RefreshCw}
                        className={clsx(
                          tableToolbarIconClass,
                          refreshing && "animate-spin",
                        )}
                      />
                    }
                    onClick={onRefresh}
                    disabled={refreshing}
                    aria-label={t("admin.products.action.refresh")}
                    title={t("admin.products.action.refresh")}
                  />
                </TableToolbar.Section>
                <button
                  type="button"
                  className="btn-primary inline-flex min-h-10 items-center gap-2"
                  onClick={() => openTransferModal()}
                >
                  <ArrowRightLeft className="size-4" />
                  {t("admin.products.stock.moveStock")}
                </button>
              </TableToolbar.Row>
              <TableToolbar.Row justify="start">
                <div className="min-w-0 flex-1 sm:min-w-64">
                  <InputField
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("admin.products.stock.searchPlaceholder")}
                    tone="light"
                    containerClassName="mb-0"
                  />
                </div>
                <div className="w-full sm:w-64">
                  <SelectField
                    options={locationFilterOptions}
                    value={selectedLocationId}
                    onValueChange={setSelectedLocationId}
                    tone="light"
                    searchable
                    clearable={false}
                  />
                </div>
              </TableToolbar.Row>
            </TableToolbar>
          }
        >
          <TableHeader headerData={headerData} />
          <TableBody>
            {filteredBalances.length === 0 ? (
              <DataTableEmptyState
                colSpan={headerData.length}
                title={t("admin.products.stock.empty")}
              />
            ) : (
              filteredBalances.map((row, index) => {
                const productMeta = row.product?.id
                  ? productMetaById.get(row.product.id)
                  : undefined;
                const unitLabel = productMeta?.baseUnitCode
                  ? ` ${productMeta.baseUnitCode}`
                  : "";
                const rowAvailableQuantity = availableQuantityForRow(row);
                const rowQuantity = Number(row.quantityOnHand ?? 0);
                const quantityTone = quantityToneClass(
                  rowQuantity,
                  productMeta?.reorderLevel,
                );
                const availableTone = quantityToneClass(
                  rowAvailableQuantity,
                  productMeta?.reorderLevel,
                );
                const detailsHref =
                  row.product?.id && row.location?.id
                    ? `${detailsBasePath}/${encodeURIComponent(row.product.id)}/${encodeURIComponent(row.location.id)}`
                    : undefined;
                return (
                  <TableRow
                    key={`${row.product?.id}-${row.location?.id}-${index}`}
                    onClick={() => {
                      if (detailsHref) router.push(detailsHref);
                    }}
                  >
                    <TableColumn>
                      <p className="font-semibold text-light-text dark:text-dark-text">
                        {row.product?.name ?? "-"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        <span className="font-mono">
                          {productMeta?.sku ?? row.product?.sku ?? "-"}
                        </span>
                        <span className="mx-1.5">•</span>
                        <span>{productMeta?.categoryName ?? "-"}</span>
                      </p>
                    </TableColumn>
                    <TableColumn>
                      <p>{locationLabel(row.location)}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {row.location?.type
                          ? t(
                              `admin.products.location.type.${row.location.type === "in_transit" ? "inTransit" : row.location.type}` as never,
                            )
                          : "-"}
                      </p>
                    </TableColumn>
                    <TableColumn className="text-right font-semibold">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${quantityTone}`}
                      >
                        {numberLabel(row.quantityOnHand)}
                        {unitLabel}
                      </span>
                      <p className="mt-0.5 text-xs font-normal text-muted">
                        {t("admin.products.inventory.currentAverageCost")}:{" "}
                        {numberLabel(row.averageCost)} {row.currencyCode}
                      </p>
                    </TableColumn>
                    <TableColumn className="text-right">
                      <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-400">
                        {numberLabel(reservedQuantity(row))}
                        {unitLabel}
                      </span>
                    </TableColumn>
                    <TableColumn className="text-right font-semibold">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${availableTone}`}
                      >
                        {numberLabel(rowAvailableQuantity)}
                        {unitLabel}
                      </span>
                      <p className="mt-0.5 text-xs font-normal text-muted">
                        {productMeta?.reorderLevel
                          ? `${t("admin.products.column.reorder")}: ${numberLabel(productMeta.reorderLevel)}${unitLabel}`
                          : "-"}
                      </p>
                    </TableColumn>
                    <TableColumn className="text-right">
                      {numberLabel(inventoryValue(row))} {row.currencyCode}
                    </TableColumn>
                    <TableColumn>
                      {dateLabel(lastMovementDate(row))}
                    </TableColumn>
                    <TableColumn className="text-center">
                      <div onClick={(event) => event.stopPropagation()}>
                        <TableRowActionsMenu
                          triggerAriaLabel={t(
                            "admin.products.inventory.actions.trigger",
                            {
                              name:
                                row.product?.name ??
                                t("admin.products.inventory.details.title"),
                            },
                          )}
                          categories={[
                            {
                              label: t(
                                "admin.products.inventory.actions.title",
                              ),
                              items: [
                                {
                                  id: "details",
                                  label: t(
                                    "admin.products.inventory.actions.viewDetails",
                                  ),
                                  icon: Eye,
                                  href: detailsHref,
                                },
                                {
                                  id: "stock-in",
                                  label: t(
                                    "admin.products.inventory.actions.stockIn",
                                  ),
                                  icon: ArrowDownToLine,
                                  onSelect: () => openTransferModal(row),
                                },
                                {
                                  id: "stock-out",
                                  label: t(
                                    "admin.products.inventory.actions.stockOut",
                                  ),
                                  icon: ArrowUpFromLine,
                                  onSelect: () => openTransferModal(row),
                                },
                                {
                                  id: "transfer",
                                  label: t(
                                    "admin.products.inventory.actions.transfer",
                                  ),
                                  icon: ArrowRightLeft,
                                  onSelect: () => openTransferModal(row),
                                },
                                {
                                  id: "adjustment",
                                  label: t(
                                    "admin.products.inventory.actions.adjustment",
                                  ),
                                  icon: SlidersHorizontal,
                                  onSelect: () => openTransferModal(row),
                                },
                                {
                                  id: "delete",
                                  label: t(
                                    "admin.products.stock.deleteOperation",
                                  ),
                                  icon: Trash2,
                                  variant: "danger",
                                  onSelect: () => setStockDeleteTarget(row),
                                },
                                {
                                  id: "history",
                                  label: t(
                                    "admin.products.inventory.actions.history",
                                  ),
                                  icon: History,
                                  href: detailsHref,
                                },
                              ],
                            },
                          ]}
                        />
                      </div>
                    </TableColumn>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

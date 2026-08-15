"use client";

import type { ReactNode } from "react";
import { Boxes, History, Package, ReceiptText, Repeat2, SlidersHorizontal } from "lucide-react";
import {
  AdminDetailSection,
  AdminDetailToolbar,
  AdminRecordNotFound,
  formatAdminDate,
} from "@/components/admin/admin-detail-layout";
import { AdminKpiCard } from "@/components/admin/dashboard/dashboard-panel";
import Table from "@/components/common/table";
import TableBody from "@/components/common/table-body";
import TableColumn from "@/components/common/table-column";
import TableHeader from "@/components/common/table-header";
import TableRow from "@/components/common/table-row";
import { useI18n } from "@/lib/i18n";
import { useAdminInventoryBalancesQuery, useAdminProductsQuery } from "@/lib/query/hooks";
import type { BalanceRow } from "@/services/reports-admin.service";

type Props = {
  productId: string;
  locationId: string;
};

function numberLabel(value: string | number | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed.toLocaleString() : "0";
}

function reservedQuantity(row?: BalanceRow) {
  return Number(
    (row as (BalanceRow & { reservedQuantity?: number | string }) | undefined)
      ?.reservedQuantity ?? 0,
  );
}

function inventoryValue(row?: BalanceRow) {
  if (!row) return 0;
  const explicit = (row as BalanceRow & { inventoryValue?: number | string })
    .inventoryValue;
  return explicit ?? Number(row.quantityOnHand ?? 0) * Number(row.averageCost ?? 0);
}

function lastMovementDate(row?: BalanceRow) {
  return (row as (BalanceRow & { lastMovementDate?: string | null }) | undefined)
    ?.lastMovementDate;
}

function availableUnitsLabel(
  product?: {
    baseUnit?: { code?: string; name?: string } | null;
    availableUnits?: Array<{
      unit?: { code?: string; name?: string } | null;
      code?: string;
      name?: string;
      conversionFactor?: number | string;
    }>;
  },
) {
  const units = product?.availableUnits ?? [];
  if (units.length === 0) return product?.baseUnit?.code ?? "-";
  return units
    .map((item) => {
      const label = item.unit?.code ?? item.code ?? item.unit?.name ?? item.name;
      if (!label) return null;
      return item.conversionFactor ? `${label} (${item.conversionFactor} base)` : label;
    })
    .filter(Boolean)
    .join(", ");
}

function TypeBadge({
  tone,
  label,
}: {
  tone: "neutral" | "success" | "warning" | "danger" | "info";
  label: string;
}) {
  const className =
    tone === "success"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
      : tone === "danger"
        ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
        : tone === "warning"
          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
          : tone === "info"
            ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400"
            : "bg-light-border text-muted dark:bg-dark-border dark:text-dark-muted";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}>
      {label}
    </span>
  );
}

function DetailSummaryTable({
  rows,
}: {
  rows: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <Table>
      <TableHeader
        headerData={rows.map((row) => ({
          title: row.label,
          className: "min-w-32",
        }))}
      />
      <TableBody>
        <TableRow>
          {rows.map((row) => (
            <TableColumn key={row.label} className="font-medium" nowrap={false}>
              {row.value}
            </TableColumn>
          ))}
        </TableRow>
      </TableBody>
    </Table>
  );
}

function InventoryHistoryTable({
  t,
}: {
  t: ReturnType<typeof useI18n>["t"];
}) {
  const rows = [
    {
      tone: "neutral" as const,
      type: t("admin.products.inventory.history.movement"),
      description: t("admin.products.inventory.history.movementDescription"),
      status: t("admin.products.inventory.history.emptyMovement"),
    },
    {
      tone: "success" as const,
      type: t("admin.products.inventory.history.purchase"),
      description: t("admin.products.inventory.history.purchaseDescription"),
      status: t("admin.products.inventory.history.emptyPurchase"),
    },
    {
      tone: "danger" as const,
      type: t("admin.products.inventory.history.sale"),
      description: t("admin.products.inventory.history.saleDescription"),
      status: t("admin.products.inventory.history.emptySale"),
    },
    {
      tone: "info" as const,
      type: t("admin.products.inventory.history.transfers"),
      description: t("admin.products.inventory.history.transfersDescription"),
      status: t("admin.products.inventory.history.emptyTransfer"),
    },
    {
      tone: "warning" as const,
      type: t("admin.products.inventory.history.adjustments"),
      description: t("admin.products.inventory.history.adjustmentsDescription"),
      status: t("admin.products.inventory.history.emptyAdjustment"),
    },
  ];

  return (
    <Table>
      <TableHeader
        headerData={[
          { title: t("admin.products.inventory.history.type") },
          { title: t("admin.products.inventory.history.description") },
          { title: t("admin.products.inventory.history.status"), align: "end" as const },
        ]}
      />
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.type}>
            <TableColumn>
              <TypeBadge tone={row.tone} label={row.type} />
            </TableColumn>
            <TableColumn nowrap={false}>{row.description}</TableColumn>
            <TableColumn className="text-right text-sm text-muted" nowrap={false}>
              {row.status}
            </TableColumn>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function AdminInventoryDetailsContent({ productId, locationId }: Props) {
  const { t } = useI18n();
  const productsQuery = useAdminProductsQuery({ page: 1, limit: 100 });
  const balancesQuery = useAdminInventoryBalancesQuery();
  const product = productsQuery.data?.items.find((item) => item.id === productId);
  const balance = balancesQuery.data?.find(
    (item) => item.product?.id === productId && item.location?.id === locationId,
  );
  const loading = productsQuery.isLoading || balancesQuery.isLoading;

  if (!loading && (!product || !balance)) {
    return (
      <AdminRecordNotFound
        backHref="/admin/products"
        backLabel={t("admin.products.inventory.details.back")}
        message={t("admin.products.inventory.details.loadFailedFallback")}
      />
    );
  }

  const reserved = reservedQuantity(balance);
  const quantity = Number(balance?.quantityOnHand ?? 0);
  const available = quantity - reserved;

  return (
    <div className="space-y-1">
      <AdminDetailToolbar
        backHref="/admin/products"
        backLabel={t("admin.products.inventory.details.back")}
        onRefresh={() => {
          void productsQuery.refetch();
          void balancesQuery.refetch();
        }}
      />

      <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          label={t("admin.products.inventory.details.currentStock")}
          value={`${numberLabel(quantity)} ${product?.baseUnit?.code ?? ""}`.trim()}
          icon={Boxes}
          tone="neutral"
        />
        <AdminKpiCard
          label={t("admin.products.inventory.available")}
          value={`${numberLabel(available)} ${product?.baseUnit?.code ?? ""}`.trim()}
          icon={Package}
          tone={available > 0 ? "success" : "warning"}
        />
        <AdminKpiCard
          label={t("admin.products.inventory.inventoryValue")}
          value={`${numberLabel(inventoryValue(balance))} ${balance?.currencyCode ?? ""}`.trim()}
          icon={ReceiptText}
          tone="neutral"
        />
        <AdminKpiCard
          label={t("admin.products.inventory.currentAverageCost")}
          value={`${numberLabel(balance?.averageCost)} ${balance?.currencyCode ?? ""}`.trim()}
          icon={History}
          tone="neutral"
        />
      </div>

      <AdminDetailSection
        title={product?.name ?? t("admin.products.inventory.details.title")}
        description={t("admin.products.inventory.details.description")}
      >
        <DetailSummaryTable
          rows={[
            {
              label: t("admin.products.inventory.balance"),
              value: `${numberLabel(quantity)} ${product?.baseUnit?.code ?? ""}`.trim(),
            },
            { label: t("admin.products.column.sku"), value: product?.sku ?? "-" },
            { label: t("admin.products.column.barcode"), value: product?.barcode ?? "-" },
            { label: t("admin.products.column.category"), value: product?.category?.name ?? "-" },
            { label: t("admin.products.inventory.location"), value: balance?.location?.name ?? "-" },
            { label: t("admin.products.column.unit"), value: product?.baseUnit?.name ?? "-" },
            { label: t("admin.products.column.availableUnits"), value: availableUnitsLabel(product) },
            { label: t("admin.products.inventory.reservedQuantity"), value: numberLabel(reserved) },
            { label: t("admin.products.inventory.lastMovement"), value: formatAdminDate(lastMovementDate(balance)) },
            { label: t("admin.products.column.status"), value: product?.isActive ? t("admin.products.status.active") : t("admin.products.status.inactive") },
          ]}
        />
      </AdminDetailSection>

      <AdminDetailSection
        title={t("admin.products.inventory.history.title")}
        description={t("admin.products.inventory.history.description")}
      >
        <InventoryHistoryTable t={t} />
      </AdminDetailSection>

      <AdminDetailSection
        title={t("admin.products.inventory.operationModel")}
        description={t("admin.products.inventory.operationModelDescription")}
      >
        <DetailSummaryTable
          rows={[
            { label: t("admin.products.inventory.stockIn"), value: t("admin.products.inventory.stockInValue") },
            { label: t("admin.products.inventory.stockOut"), value: t("admin.products.inventory.stockOutValue") },
            { label: t("admin.products.inventory.transfer"), value: <span className="inline-flex items-center gap-1"><Repeat2 className="size-4" /> {t("admin.products.inventory.transferValue")}</span> },
            { label: t("admin.products.inventory.adjustment"), value: <span className="inline-flex items-center gap-1"><SlidersHorizontal className="size-4" /> {t("admin.products.inventory.adjustmentValue")}</span> },
            { label: t("admin.products.inventory.adjustmentSource"), value: t("admin.products.inventory.adjustmentSourceValue") },
            { label: t("admin.products.inventory.auditMode"), value: t("admin.products.inventory.auditModeValue") },
          ]}
        />
      </AdminDetailSection>
    </div>
  );
}

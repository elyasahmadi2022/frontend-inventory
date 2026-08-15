"use client";

import { gooeyToast } from "goey-toast";
import {
  CreditCard,
  PackagePlus,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminKpiCard } from "@/components/admin/dashboard/dashboard-panel";
import { renderCurrencyAmountList } from "@/components/admin/shared/admin-money-display";
import { AdminPurchasesTable } from "@/components/admin/purchases/admin-purchases-table";
import { toPaginationMeta } from "@/lib/admin/pagination-meta";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  useAdminInventoryLocationsQuery,
  useAdminProductsQuery,
  useAdminPurchaseVendorsQuery,
  useAdminPurchasesQuery,
  useAdminSaleAccountsQuery,
} from "@/lib/query/hooks";
import type { CurrencyCode } from "@/services/sales.service";
import type { PurchaseStatus } from "@/services/purchases.service";

function totalsByCurrency(
  rows: Array<{
    currencyCode: CurrencyCode;
    total?: string | number;
    paidTotal?: string | number;
  }>,
) {
  const map = new Map<CurrencyCode, { total: number; paid: number }>();
  for (const row of rows) {
    const current = map.get(row.currencyCode) ?? { total: 0, paid: 0 };
    current.total += Number(row.total ?? 0);
    current.paid += Number(row.paidTotal ?? 0);
    map.set(row.currencyCode, current);
  }
  return [...map.entries()];
}

function currencyRows(
  entries: Array<[CurrencyCode, { total: number; paid: number }]>,
  language: string,
  field: "total" | "paid" | "balance",
) {
  return (
    <span className="flex flex-col gap-1 text-sm font-semibold">
      {entries.map(([currencyCode, values]) => (
        <span key={currencyCode} className="block">
          {renderCurrencyAmountList(
            [
              {
                currencyCode,
                amount:
                  field === "total"
                    ? values.total
                    : field === "paid"
                      ? values.paid
                      : values.total - values.paid,
              },
            ],
            language,
          )}
        </span>
      ))}
    </span>
  );
}

type AdminPurchasesContentProps = {
  showHeader?: boolean;
};

export function AdminPurchasesContent({
  showHeader = true,
}: AdminPurchasesContentProps) {
  const { language, t } = useI18n();
  const [status, setStatus] = useState<PurchaseStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const purchasesQuery = useAdminPurchasesQuery({
    page,
    limit: pageSize,
    status,
  });
  const vendorsQuery = useAdminPurchaseVendorsQuery();
  const productsQuery = useAdminProductsQuery({
    page: 1,
    limit: 100,
    isActive: true,
  });
  const locationsQuery = useAdminInventoryLocationsQuery();
  const accountsQuery = useAdminSaleAccountsQuery([
    "inventory",
    "expense",
    "cash",
    "bank",
    "sarafi",
    "daskhil",
  ]);

  useEffect(() => {
    const error =
      purchasesQuery.error ??
      vendorsQuery.error ??
      productsQuery.error ??
      locationsQuery.error ??
      accountsQuery.error;
    if (!error) return;
    gooeyToast.error(t("admin.purchases.toast.loadFailedTitle"), {
      description:
        error instanceof ApiError
          ? error.message
          : t("admin.purchases.toast.loadFailedFallback"),
    });
  }, [
    accountsQuery.error,
    locationsQuery.error,
    productsQuery.error,
    purchasesQuery.error,
    t,
    vendorsQuery.error,
  ]);

  const purchases = useMemo(
    () => purchasesQuery.data?.items ?? [],
    [purchasesQuery.data?.items],
  );
  const currencyTotals = useMemo(
    () => totalsByCurrency(purchases),
    [purchases],
  );

  return (
    <div className="space-y-1">
      {showHeader ? (
        <AdminPageHeader
          eyebrow={t("admin.purchases.eyebrow")}
          title={t("admin.purchases.title")}
          description={t("admin.purchases.description")}
        />
      ) : null}
      <div className="space-y-1">
        <div className="grid gap-1 grid-cols-2 md:grid-cols-3 md:grid-cols-3 lg:grid-cols-4">
          <AdminKpiCard
            label={t("admin.purchases.stats.bills")}
            value={purchases.length}
            icon={ReceiptText}
            tone="neutral"
          />
          <AdminKpiCard
            label={t("admin.purchases.stats.total")}
            value={currencyRows(currencyTotals, language, "total")}
            icon={PackagePlus}
            tone="success"
          />
          <AdminKpiCard
            label={t("admin.purchases.stats.paid")}
            value={currencyRows(currencyTotals, language, "paid")}
            icon={CreditCard}
            tone="neutral"
          />
          <AdminKpiCard
            label={t("admin.purchases.stats.balance")}
            value={currencyRows(currencyTotals, language, "balance")}
            icon={WalletCards}
            tone="warning"
          />
        </div>
        <AdminPurchasesTable
          accounts={accountsQuery.data ?? []}
          items={purchases}
          loading={
            purchasesQuery.isLoading ||
            vendorsQuery.isLoading ||
            productsQuery.isLoading ||
            locationsQuery.isLoading ||
            accountsQuery.isLoading
          }
          locations={locationsQuery.data ?? []}
          pagination={toPaginationMeta(purchasesQuery.data?.pagination)}
          products={productsQuery.data?.items ?? []}
          refreshing={
            purchasesQuery.isFetching ||
            vendorsQuery.isFetching ||
            productsQuery.isFetching ||
            locationsQuery.isFetching ||
            accountsQuery.isFetching
          }
          status={status}
          vendors={vendorsQuery.data ?? []}
          onStatusChange={(nextStatus) => {
            setStatus(nextStatus);
            setPage(1);
          }}
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
          onRefresh={() => {
            void purchasesQuery.refetch();
            void vendorsQuery.refetch();
            void productsQuery.refetch();
            void locationsQuery.refetch();
            void accountsQuery.refetch();
          }}
        />
      </div>
    </div>
  );
}

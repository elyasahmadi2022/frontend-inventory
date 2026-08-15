"use client";

import { gooeyToast } from "goey-toast";
import { Banknote, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminKpiCard } from "@/components/admin/dashboard/dashboard-panel";
import { renderCurrencyAmountList } from "@/components/admin/shared/admin-money-display";
import { AdminSalesTable } from "@/components/admin/sales/admin-sales-table";
import { toPaginationMeta } from "@/lib/admin/pagination-meta";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  useAdminInventoryLocationsQuery,
  useAdminProductsQuery,
  useAdminSaleAccountsQuery,
  useAdminSaleCustomersQuery,
  useAdminSalesQuery,
} from "@/lib/query/hooks";
import type { CurrencyCode, SaleStatus } from "@/services/sales.service";

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

type AdminSalesContentProps = {
  showHeader?: boolean;
};

export function AdminSalesContent({
  showHeader = true,
}: AdminSalesContentProps) {
  const { language, t } = useI18n();
  const [status, setStatus] = useState<SaleStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const salesQuery = useAdminSalesQuery({ page, limit: pageSize, status });
  const customersQuery = useAdminSaleCustomersQuery();
  const productsQuery = useAdminProductsQuery({
    page: 1,
    limit: 100,
    isActive: true,
  });
  const locationsQuery = useAdminInventoryLocationsQuery();
  const accountsQuery = useAdminSaleAccountsQuery([
    "sales_revenue",
    "inventory",
    "cost_of_goods_sold",
    "cash",
    "bank",
    "sarafi",
    "daskhil",
  ]);

  useEffect(() => {
    const error =
      salesQuery.error ??
      customersQuery.error ??
      productsQuery.error ??
      locationsQuery.error ??
      accountsQuery.error;
    if (!error) return;
    gooeyToast.error(t("admin.sales.toast.loadFailedTitle"), {
      description:
        error instanceof ApiError
          ? error.message
          : t("admin.sales.toast.loadFailedFallback"),
    });
  }, [
    accountsQuery.error,
    customersQuery.error,
    locationsQuery.error,
    productsQuery.error,
    salesQuery.error,
    t,
  ]);

  const sales = useMemo(
    () => salesQuery.data?.items ?? [],
    [salesQuery.data?.items],
  );
  const currencyTotals = useMemo(() => totalsByCurrency(sales), [sales]);

  return (
    <div className="space-y-1">
      {showHeader ? (
        <AdminPageHeader
          eyebrow={t("admin.sales.eyebrow")}
          title={t("admin.sales.title")}
          description={t("admin.sales.description")}
        />
      ) : null}
      <div className="space-y-1">
        <div className="grid gap-1 grid-cols-2 md:grid-cols-3 md:grid-cols-3 lg:grid-cols-4">
          <AdminKpiCard
            label={t("admin.sales.stats.invoices")}
            value={sales.length}
            icon={ReceiptText}
            tone="neutral"
          />
          <AdminKpiCard
            label={t("admin.sales.stats.total")}
            value={currencyRows(currencyTotals, language, "total")}
            icon={TrendingUp}
            tone="success"
          />
          <AdminKpiCard
            label={t("admin.sales.stats.paid")}
            value={currencyRows(currencyTotals, language, "paid")}
            icon={Banknote}
            tone="neutral"
          />
          <AdminKpiCard
            label={t("admin.sales.stats.balance")}
            value={currencyRows(currencyTotals, language, "balance")}
            icon={WalletCards}
            tone="warning"
          />
        </div>
        <AdminSalesTable
          accounts={accountsQuery.data ?? []}
          customers={customersQuery.data ?? []}
          items={sales}
          loading={
            salesQuery.isLoading ||
            customersQuery.isLoading ||
            productsQuery.isLoading ||
            locationsQuery.isLoading ||
            accountsQuery.isLoading
          }
          locations={locationsQuery.data ?? []}
          pagination={toPaginationMeta(salesQuery.data?.pagination)}
          products={productsQuery.data?.items ?? []}
          refreshing={
            salesQuery.isFetching ||
            customersQuery.isFetching ||
            productsQuery.isFetching ||
            locationsQuery.isFetching ||
            accountsQuery.isFetching
          }
          status={status}
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
            void salesQuery.refetch();
            void customersQuery.refetch();
            void productsQuery.refetch();
            void locationsQuery.refetch();
            void accountsQuery.refetch();
          }}
        />
      </div>
    </div>
  );
}

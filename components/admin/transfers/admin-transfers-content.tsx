"use client";

import { gooeyToast } from "goey-toast";
import { ArrowLeftRight, Banknote, Receipt, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminPageHeader, AdminStatCard } from "@/components/admin/admin-page-header";
import {
  formatAdminNumber,
  groupCurrencyAmounts,
  renderCurrencyAmountList,
} from "@/components/admin/shared/admin-money-display";
import { AdminTransfersTable } from "@/components/admin/transfers/admin-transfers-table";
import { toPaginationMeta } from "@/lib/admin/pagination-meta";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAdminAccountsQuery, useAdminTransfersQuery } from "@/lib/query/hooks";
import type { TransferStatus } from "@/services/transfers.service";

export function AdminTransfersContent() {
  const { language, t } = useI18n();
  const [status, setStatus] = useState<TransferStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const transfersQuery = useAdminTransfersQuery({ page, limit: pageSize, status });
  const accountsQuery = useAdminAccountsQuery({ page: 1, limit: 100, isActive: true });

  useEffect(() => {
    const error = transfersQuery.error ?? accountsQuery.error;
    if (!error) return;
    gooeyToast.error(t("admin.transfers.toast.loadFailedTitle"), {
      description:
        error instanceof ApiError
          ? error.message
          : t("admin.transfers.toast.loadFailedFallback"),
    });
  }, [accountsQuery.error, t, transfersQuery.error]);

  const transfers = transfersQuery.data?.items ?? [];
  const amountEntries = groupCurrencyAmounts(
    transfers.map((item) => ({
      currencyCode: item.currencyCode,
      amount: item.amount,
    })),
  );
  return (
    <div className="space-y-1">
      <AdminPageHeader eyebrow={t("admin.transfers.eyebrow")} title={t("admin.transfers.title")} description={t("admin.transfers.description")} />
      <div className="space-y-1">
        <div className="grid gap-1 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <AdminStatCard label={t("admin.transfers.stats.transfers")} value={formatAdminNumber(transfers.length, language)} icon={<ArrowLeftRight className="size-5" />} />
          <AdminStatCard label={t("admin.transfers.stats.amount")} value={renderCurrencyAmountList(amountEntries, language)} icon={<Banknote className="size-5" />} tone="success" />
          <AdminStatCard label={t("admin.transfers.stats.posted")} value={formatAdminNumber(transfers.filter((item) => item.status === "posted").length, language)} icon={<Receipt className="size-5" />} tone="neutral" />
          <AdminStatCard label={t("admin.transfers.stats.accounts")} value={formatAdminNumber(accountsQuery.data?.length ?? 0, language)} icon={<WalletCards className="size-5" />} tone="neutral" />
        </div>
        <AdminTransfersTable
          accounts={accountsQuery.data ?? []}
          items={transfers}
          loading={transfersQuery.isLoading || accountsQuery.isLoading}
          pagination={toPaginationMeta(transfersQuery.data?.pagination)}
          refreshing={transfersQuery.isFetching || accountsQuery.isFetching}
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
          showCreate
          onRefresh={() => { void transfersQuery.refetch(); void accountsQuery.refetch(); }}
        />
      </div>
    </div>
  );
}

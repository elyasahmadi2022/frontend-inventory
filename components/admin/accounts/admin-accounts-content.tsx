"use client";

import { gooeyToast } from "goey-toast";
import { Activity, CircleDollarSign, Landmark, PiggyBank, Receipt, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminRecordExpenseModal } from "@/components/admin/accounts/admin-record-expense-modal";
import { AdminRecordFundingModal } from "@/components/admin/accounts/admin-record-funding-modal";
import { AdminAccountsTable } from "@/components/admin/accounts/admin-accounts-table";
import { AdminKpiCard } from "@/components/admin/dashboard/dashboard-panel";
import {
  formatAdminNumber,
  groupCurrencyAmounts,
  renderCurrencyAmountList,
  totalCurrencyAmount,
} from "@/components/admin/shared/admin-money-display";
import TableToolbar from "@/components/common/table-tool-bar";
import { toPaginationMeta } from "@/lib/admin/pagination-meta";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  useAdminAccountsPageQuery,
  useAdminAccountsQuery,
  useAdminCurrenciesQuery,
} from "@/lib/query/hooks";
import type { AccountCategory, AccountType, CurrencyCode } from "@/services/accounts.service";

type AccountTab = AccountCategory | "all";

export function AdminAccountsContent() {
  const { language, t } = useI18n();
  const [category, setCategory] = useState<AccountTab>("all");
  const [type, setType] = useState<AccountType | "all">("all");
  const [currency, setCurrency] = useState<CurrencyCode | "all">("all");
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [fundingOpen, setFundingOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const currenciesQuery = useAdminCurrenciesQuery();
  const accountsQuery = useAdminAccountsPageQuery({
    page,
    limit: pageSize,
    category: category === "all" ? undefined : category,
    type: type === "all" ? undefined : type,
    currencyCode: currency === "all" ? undefined : currency,
  });
  const statsQuery = useAdminAccountsQuery({
    limit: 100,
    category: category === "all" ? undefined : category,
    type: type === "all" ? undefined : type,
    currencyCode: currency === "all" ? undefined : currency,
  });

  useEffect(() => {
    if (!accountsQuery.error) return;
    gooeyToast.error(t("admin.accounts.toast.loadFailedTitle"), {
      description:
        accountsQuery.error instanceof ApiError
          ? accountsQuery.error.message
          : t("admin.accounts.toast.loadFailedFallback"),
    });
  }, [accountsQuery.error, t]);

  const accounts = useMemo(
    () => accountsQuery.data?.items ?? [],
    [accountsQuery.data?.items],
  );
  const statsAccounts = useMemo(
    () => statsQuery.data ?? accounts,
    [accounts, statsQuery.data],
  );
  const activeCount = statsAccounts.filter((account) => account.isActive).length;
  const cashCount = statsAccounts.filter((account) => ["cash", "bank", "sarafi", "daskhil"].includes(account.type)).length;
  const controlCount = statsAccounts.filter((account) => account.isControlAccount).length;
  const totalBalanceEntries = useMemo(
    () =>
      groupCurrencyAmounts(
        statsAccounts.flatMap((account) =>
          (account.balances ?? []).map((balance) => ({
            currencyCode: balance.currencyCode,
            amount: balance.balance,
          })),
        ),
      ),
    [statsAccounts],
  );
  const totalBalance = totalCurrencyAmount(totalBalanceEntries);
  const totalAccounts = accountsQuery.data?.pagination?.total ?? statsAccounts.length;
  const tabLabel = t(
    category === "all"
      ? "admin.accounts.tabs.all"
      : (`admin.accounts.category.${category}` as never),
  );
  const tabs = useMemo(
    () => [
      { id: "all", label: t("admin.accounts.tabs.all"), icon: <Landmark className="size-4" /> },
      { id: "asset", label: t("admin.accounts.tabs.assets"), icon: <PiggyBank className="size-4" /> },
      { id: "liability", label: t("admin.accounts.tabs.liabilities"), icon: <Receipt className="size-4" /> },
      { id: "equity", label: t("admin.accounts.tabs.equity"), icon: <Landmark className="size-4" /> },
      { id: "revenue", label: t("admin.accounts.tabs.revenue"), icon: <WalletCards className="size-4" /> },
      { id: "expense", label: t("admin.accounts.tabs.expense"), icon: <Receipt className="size-4" /> },
    ],
    [t],
  );

  return (
    <div className="space-y-1">
      <AdminRecordExpenseModal
        accounts={statsAccounts}
        currencies={currenciesQuery.data ?? []}
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
      />
      {fundingOpen ? <AdminRecordFundingModal accounts={statsAccounts} currencies={currenciesQuery.data ?? []} open onClose={() => setFundingOpen(false)} /> : null}
      <AdminPageHeader
        eyebrow={t("admin.accounts.eyebrow")}
        title={t("admin.accounts.title")}
        description={t("admin.accounts.description")}
        actions={<div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary inline-flex min-h-10 items-center gap-2" onClick={() => setFundingOpen(true)}>
            <CircleDollarSign className="size-4" />{t("admin.accounts.funding.action")}
          </button>
          <button
            type="button"
            className="btn-primary inline-flex min-h-10 items-center gap-2"
            onClick={() => setExpenseOpen(true)}
          >
            <Receipt className="size-4" />
            {t("admin.accounts.action.recordExpense")}
          </button>
        </div>}
      />
      <div className="space-y-1">
        <div className="grid gap-1 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          <AdminKpiCard label={t("admin.accounts.stats.accounts")} value={formatAdminNumber(totalAccounts, language)} hint={tabLabel} icon={Landmark} />
          <AdminKpiCard label={t("admin.accounts.stats.active")} value={formatAdminNumber(activeCount, language)} hint={t("admin.accounts.stats.fromLoaded", { count: formatAdminNumber(statsAccounts.length, language) })} icon={Activity} tone="success" />
          <AdminKpiCard label={t("admin.accounts.stats.balance")} value={<span className="flex flex-col gap-1 text-sm font-semibold">{totalBalanceEntries.map((entry) => <span key={entry.currencyCode}>{renderCurrencyAmountList([entry], language)}</span>)}</span>} hint={t("admin.accounts.stats.baseHint")} icon={PiggyBank} tone={totalBalance >= 0 ? "success" : "error"} />
          <AdminKpiCard label={t("admin.accounts.stats.cash")} value={formatAdminNumber(cashCount, language)} hint={t("admin.accounts.stats.control", { count: formatAdminNumber(controlCount, language) })} icon={WalletCards} tone="neutral" />
        </div>
        <TableToolbar.ViewTabs
          tabs={tabs}
          value={category}
          onValueChange={(value) => {
            setCategory(value as AccountTab);
            setType("all");
            setPage(1);
          }}
        />
        
        <AdminAccountsTable
          items={accounts}
          loading={accountsQuery.isLoading}
          pagination={toPaginationMeta(accountsQuery.data?.pagination)}
          refreshing={accountsQuery.isFetching}
          category={category}
          type={type}
          currency={currency}
          onRefresh={() => void accountsQuery.refetch()}
          onTypeChange={(nextType) => {
            setType(nextType);
            setPage(1);
          }}
          onCurrencyChange={(nextCurrency) => {
            setCurrency(nextCurrency);
            setPage(1);
          }}
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}

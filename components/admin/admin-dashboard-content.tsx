"use client";

import clsx from "clsx";
import { Fragment, useMemo, useState } from "react";
import {
  AdminKpiCard,
  DashboardMiniStat,
  DashboardPanel,
} from "@/components/admin/dashboard/dashboard-panel";
import {
  formatAdminNumber,
  renderCurrencyAmountList,
  totalCurrencyAmount,
} from "@/components/admin/shared/admin-money-display";
import DataTableEmptyState from "@/components/common/data-table-empty-state";
import { DatePickerField } from "@/components/common/date-picker-field";
import { SelectField } from "@/components/common/select-field";
import Table from "@/components/common/table";
import TableBody from "@/components/common/table-body";
import TableColumn from "@/components/common/table-column";
import TableHeader from "@/components/common/table-header";
import TableRow from "@/components/common/table-row";
import TableToolbar from "@/components/common/table-tool-bar";
import {
  TableToolbarIcon,
  tableToolbarIconClass,
} from "@/components/common/table-toolbar-icons";
import { ScrollReveal } from "@/components/dashboard/scroll-reveal";
import { useCalendarPreference } from "@/hooks/use-calendar-preference";
import { formatAppDate, getLocalDateString } from "@/lib/date-format";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import { useAdminDashboardQuery } from "@/lib/query/hooks";
import type {
  AdminDashboardAccountRef,
  AdminStoreDashboard,
  CurrencyTotal,
} from "@/services/analytics.service";
import {
  BookOpenText,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

const emptyDashboard: AdminStoreDashboard = {
  generatedAt: new Date().toISOString(),
  users: { total: 0 },
  accounts: {
    counts: {
      total: 0,
      active: 0,
      assets: 0,
      liabilities: 0,
      equity: 0,
      revenue: 0,
      expenses: 0,
      cash: 0,
    },
    balances: {
      assets: [],
      liabilities: [],
      equity: [],
      revenue: [],
      expenses: [],
      cash: [],
    },
  },
  ledger: {
    journals: {},
    journalLines: 0,
    accountBalances: 0,
    partnerLedgerAccounts: 0,
    recentTransactions: [],
  },
  partners: { total: 0, active: 0, byType: {} },
  inventory: {
    products: 0,
    activeProducts: 0,
    locationsWithStock: 0,
    lowStockProducts: 0,
    costValue: 0,
  },
  sales: { invoices: 0, posted: 0, totals: [], outstanding: [] },
  purchases: { bills: 0, posted: 0, totals: [], outstanding: [] },
  payments: { count: 0, totals: [] },
  transfers: { count: 0, posted: 0, totals: [] },
};

function formatMoney(value: number, language: string): string {
  return value.toLocaleString(language === "en" ? "en-US" : language, {
    maximumFractionDigits: 2,
  });
}

function totalCurrency(values: CurrencyTotal[]) {
  return values.reduce((sum, item) => sum + Number(item.total ?? 0), 0);
}

function currencyRows(
  entries: Array<{ currencyCode: string; amount: number | string }>,
  language: string,
) {
  return (
    <span className="flex flex-col gap-1 text-sm font-semibold">
      {entries.map((entry) => (
        <span key={entry.currencyCode} className="block">
          {renderCurrencyAmountList(
            [
              {
                currencyCode: entry.currencyCode,
                amount: Number(entry.amount),
              },
            ],
            language,
          )}
        </span>
      ))}
    </span>
  );
}

function inlineCurrencyRows(
  entries: Array<{ currencyCode: string; amount: number | string }>,
  language: string,
) {
  if (entries.length === 0) return "0";
  return (
    <span className="flex  flex-col flex-wrap items-center justify-end gap-x-1.5 gap-y-1 whitespace-nowrap">
      {entries.map((entry, index) => (
        <span key={entry.currencyCode} className="inline-flex items-center">
          {index > 0 ? "(" : null}
          {renderCurrencyAmountList(
            [
              {
                currencyCode: entry.currencyCode,
                amount: Number(entry.amount),
              },
            ],
            language,
          )}
          {index > 0 ? ")" : null}
        </span>
      ))}
    </span>
  );
}

function dateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getLocalDateString(date);
}

function accountLabel(account?: AdminDashboardAccountRef | null) {
  if (!account) return "-";
  return `${account.code} · ${account.name}`;
}

function formatOperation(value: string) {
  return value.replaceAll("_", " ");
}

function signedTone(value: number): "success" | "error" {
  return value >= 0 ? "success" : "error";
}

function signedIcon(value: number) {
  return value >= 0 ? TrendingUp : TrendingDown;
}

type LedgerRangePreset = "today" | "7d" | "30d" | "custom";

const ledgerRangeOptions: {
  labelKey: TranslationKey;
  value: LedgerRangePreset;
}[] = [
  { labelKey: "admin.dashboard.ledger.range.today", value: "today" },
  { labelKey: "admin.dashboard.ledger.range.7d", value: "7d" },
  { labelKey: "admin.dashboard.ledger.range.30d", value: "30d" },
  { labelKey: "admin.dashboard.ledger.range.custom", value: "custom" },
];

const ledgerColumnDefs: {
  titleKey: TranslationKey;
  align?: "start" | "center" | "end";
}[] = [
  { titleKey: "admin.dashboard.ledger.column.date" },
  { titleKey: "admin.dashboard.ledger.column.payer" },
  { titleKey: "admin.dashboard.ledger.column.receiver" },
  { titleKey: "admin.dashboard.ledger.column.reason" },
  { titleKey: "admin.dashboard.ledger.column.operation" },
  { titleKey: "admin.dashboard.ledger.column.debit", align: "end" },
  { titleKey: "admin.dashboard.ledger.column.credit", align: "end" },
];

const journalColumnDefs: {
  titleKey: TranslationKey;
  align?: "start" | "center" | "end";
}[] = [
  { titleKey: "admin.dashboard.ledger.column.date" },
  { titleKey: "admin.dashboard.journal.column.entry" },
  { titleKey: "admin.dashboard.ledger.column.reason" },
  { titleKey: "admin.dashboard.ledger.column.operation" },
  { titleKey: "admin.dashboard.ledger.column.debit", align: "end" },
  { titleKey: "admin.dashboard.ledger.column.credit", align: "end" },
];

export function AdminDashboardContent() {
  const { language, t } = useI18n();
  const { calendarType } = useCalendarPreference();
  const today = useMemo(() => getLocalDateString(), []);
  const [ledgerRange, setLedgerRange] = useState<LedgerRangePreset>("today");
  const [customFrom, setCustomFrom] = useState(dateDaysAgo(29));
  const [customTo, setCustomTo] = useState(today);
  const ledgerParams = useMemo(() => {
    if (ledgerRange === "today") return { from: today, to: today };
    if (ledgerRange === "7d") return { from: dateDaysAgo(6), to: today };
    if (ledgerRange === "custom") {
      return {
        from: customFrom || undefined,
        to: customTo || undefined,
      };
    }
    return { from: dateDaysAgo(29), to: today };
  }, [customFrom, customTo, ledgerRange, today]);
  const { data, isLoading, isError, isFetching, refetch } =
    useAdminDashboardQuery(ledgerParams);
  const dashboard = isError || !data ? emptyDashboard : data;
  const postedJournals = dashboard.ledger.journals.posted ?? 0;
  const assetTotals = useMemo(
    () =>
      dashboard.accounts.balances.assets.map((item) => ({
        currencyCode: item.currencyCode,
        amount: Number(item.total),
      })),
    [dashboard.accounts.balances.assets],
  );
  const totalAssets = totalCurrencyAmount(assetTotals);
  const cashTotal = totalCurrency(dashboard.accounts.balances.cash);
  const receivableTotal = totalCurrency(dashboard.sales.outstanding);
  const payableTotal = totalCurrency(dashboard.purchases.outstanding);
  const translatedLedgerRangeOptions = useMemo(
    () =>
      ledgerRangeOptions.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t],
  );
  const ledgerHeaderData = useMemo(
    () =>
      ledgerColumnDefs.map((column) => ({
        title: t(column.titleKey),
        align: column.align,
      })),
    [t],
  );
  const journalHeaderData = useMemo(
    () =>
      journalColumnDefs.map((column) => ({
        title: t(column.titleKey),
        align: column.align,
      })),
    [t],
  );
  const ledgerTransactions = dashboard.ledger.recentTransactions;
  const ledgerToolbar = (
    <TableToolbar>
      <TableToolbar.Row justify="between">
        <TableToolbar.Section>
          <span className="text-xs font-semibold text-light-muted dark:text-dark-muted">
            {t("admin.dashboard.ledger.table.count", {
              count: ledgerTransactions.length,
            })}
          </span>
          <TableToolbar.IconButton
            iconOnly
            icon={
              <TableToolbarIcon
                icon={RefreshCw}
                className={clsx(
                  tableToolbarIconClass,
                  isFetching && "animate-spin",
                )}
              />
            }
            onClick={() => void refetch()}
            disabled={isFetching || isLoading}
            aria-label={
              isFetching
                ? t("admin.dashboard.action.refreshing")
                : t("admin.dashboard.action.refresh")
            }
            title={
              isFetching
                ? t("admin.dashboard.action.refreshing")
                : t("admin.dashboard.action.refresh")
            }
          />
        </TableToolbar.Section>
      </TableToolbar.Row>

      <TableToolbar.Row justify="start" className="gap-2">
        <div className="w-full shrink-0 sm:w-52">
          <SelectField
            clearable={false}
            tone="light"
            placeholder={t("admin.dashboard.ledger.range.label")}
            options={translatedLedgerRangeOptions}
            value={ledgerRange}
            onValueChange={(value) =>
              setLedgerRange(value as LedgerRangePreset)
            }
          />
        </div>
        <div className="w-full shrink-0 sm:w-44">
          <DatePickerField
            tone="light"
            value={
              ledgerRange === "custom" ? customFrom : (ledgerParams.from ?? "")
            }
            disabled={ledgerRange !== "custom"}
            placeholder={t("admin.dashboard.ledger.fromDate")}
            onChange={setCustomFrom}
          />
        </div>
        <div className="w-full shrink-0 sm:w-44">
          <DatePickerField
            tone="light"
            value={
              ledgerRange === "custom" ? customTo : (ledgerParams.to ?? "")
            }
            disabled={ledgerRange !== "custom"}
            placeholder={t("admin.dashboard.ledger.toDate")}
            onChange={setCustomTo}
          />
        </div>
      </TableToolbar.Row>
    </TableToolbar>
  );

  return (
    <div className=" space-y-1 pb-6">
      <div className="grid gap-1  sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse border border-light-border bg-light-surface/60 dark:border-dark-border dark:bg-dark-surface/60"
            />
          ))
        ) : (
          <>
            <AdminKpiCard
              label={t("admin.dashboard.kpi.assets")}
              value={currencyRows(assetTotals, language)}
              icon={signedIcon(totalAssets)}
              tone={signedTone(totalAssets)}
            />
            <AdminKpiCard
              label={t("admin.dashboard.kpi.cashAndBanks")}
              value={currencyRows(
                dashboard.accounts.balances.cash.map((item) => ({
                  currencyCode: item.currencyCode,
                  amount: item.total,
                })),
                language,
              )}
              icon={signedIcon(cashTotal)}
              tone={signedTone(cashTotal)}
              hint={t("admin.dashboard.kpi.cashAccountsHint", {
                count: dashboard.accounts.counts.cash,
              })}
            />
            <AdminKpiCard
              label={t("admin.dashboard.kpi.receivables")}
              value={currencyRows(
                dashboard.sales.outstanding.map((item) => ({
                  currencyCode: item.currencyCode,
                  amount: item.total,
                })),
                language,
              )}
              icon={signedIcon(receivableTotal)}
              tone={signedTone(receivableTotal)}
              hint={t("admin.dashboard.kpi.salesInvoicesHint", {
                count: dashboard.sales.invoices,
              })}
            />
            <AdminKpiCard
              label={t("admin.dashboard.kpi.payables")}
              value={currencyRows(
                dashboard.purchases.outstanding.map((item) => ({
                  currencyCode: item.currencyCode,
                  amount: item.total,
                })),
                language,
              )}
              icon={payableTotal > 0 ? TrendingDown : TrendingUp}
              tone={payableTotal > 0 ? "error" : "success"}
              hint={t("admin.dashboard.kpi.purchaseBillsHint", {
                count: dashboard.purchases.bills,
              })}
            />
          </>
        )}
      </div>

      <div className="grid items-stretch gap-2  xl:grid-cols-12">
        <ScrollReveal className="xl:col-span-12" delay={0.03}>
          <DashboardPanel
            title={t("admin.dashboard.journal.title")}
            description={t("admin.dashboard.journal.description")}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center border border-light-border bg-light-surface text-primary-600 dark:border-dark-border dark:bg-dark-surface dark:text-primary-400">
                  <BookOpenText
                    className="size-5"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </span>
                <div>
                  <p className="text-sm font-semibold text-light-text dark:text-dark-text">
                    {t("admin.dashboard.journal.dailyTitle")}
                  </p>
                  <p className="text-xs text-light-muted dark:text-dark-muted">
                    {t("admin.dashboard.journal.table.count", {
                      count: ledgerTransactions.length,
                    })}
                  </p>
                </div>
              </div>
              <p className="max-w-2xl text-xs leading-5 text-light-muted dark:text-dark-muted">
                {t("admin.dashboard.journal.help")}
              </p>
            </div>
            <div className="overflow-hidden border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface dark:shadow-dark-sm">
              <Table toolbar={ledgerToolbar}>
                <TableHeader headerData={journalHeaderData} />
                <TableBody>
                  {ledgerTransactions.length === 0 ? (
                    <DataTableEmptyState
                      colSpan={journalHeaderData.length}
                      title={t("admin.dashboard.journal.empty.title")}
                      description={t(
                        "admin.dashboard.journal.empty.description",
                      )}
                    />
                  ) : (
                    ledgerTransactions.map((journal) => (
                      <Fragment key={journal.id}>
                        <TableRow>
                          <TableColumn className="text-xs text-muted">
                            {formatAppDate(
                              journal.entryDate,
                              calendarType,
                              language,
                            )}
                          </TableColumn>
                          <TableColumn nowrap={false}>
                            <p className="font-semibold text-light-text dark:text-dark-text">
                              {journal.number}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted">
                              {journal.lines.length}{" "}
                              {t("admin.dashboard.journal.lines")}
                            </p>
                          </TableColumn>
                          <TableColumn nowrap={false} className="max-w-sm">
                            {journal.reason || journal.description || "-"}
                          </TableColumn>
                          <TableColumn>
                            <p className="font-medium capitalize text-light-text dark:text-dark-text">
                              {formatOperation(journal.sourceType)}
                            </p>
                          </TableColumn>
                          <TableColumn className="">
                            <span className="font-medium tabular-nums text-emerald-700 dark:text-emerald-300">
                              {inlineCurrencyRows(
                                journal.currencyTotals
                                  .filter((item) => item.debit !== 0)
                                  .map((item) => ({
                                    currencyCode: item.currencyCode,
                                    amount: item.debit,
                                  })),
                                language,
                              )}
                            </span>
                          </TableColumn>
                          <TableColumn className="">
                            <span className="font-medium tabular-nums text-rose-700 dark:text-rose-300">
                              {inlineCurrencyRows(
                                journal.currencyTotals
                                  .filter((item) => item.credit !== 0)
                                  .map((item) => ({
                                    currencyCode: item.currencyCode,
                                    amount: item.credit,
                                  })),
                                language,
                              )}
                            </span>
                          </TableColumn>
                        </TableRow>
                        <TableRow>
                          <TableColumn
                            colSpan={journalHeaderData.length}
                            nowrap={false}
                            className="bg-light-bg/70 p-0 dark:bg-dark-bg/60"
                          >
                            <div className="px-4 py-3">
                              <div className="mb-2 grid grid-cols-[minmax(12rem,1.3fr)_minmax(8rem,0.8fr)_minmax(10rem,1fr)_7rem_7rem] gap-3 border-b border-light-border pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-light-muted dark:border-dark-border dark:text-dark-muted">
                                <span>
                                  {t("admin.dashboard.journal.column.account")}
                                </span>
                                <span>
                                  {t("admin.dashboard.journal.column.partner")}
                                </span>
                                <span>
                                  {t("admin.dashboard.journal.column.memo")}
                                </span>
                                <span className="text-end">
                                  {t("admin.dashboard.ledger.column.debit")}
                                </span>
                                <span className="text-end">
                                  {t("admin.dashboard.ledger.column.credit")}
                                </span>
                              </div>
                              {journal.lines.map((line) => (
                                <div
                                  key={line.id}
                                  className="grid grid-cols-1 gap-2 border-b border-light-border/70 py-2 text-xs text-light-muted last:border-b-0 dark:border-dark-border/70 dark:text-dark-muted sm:grid-cols-[minmax(12rem,1.3fr)_minmax(8rem,0.8fr)_minmax(10rem,1fr)_7rem_7rem]"
                                >
                                  <span className="font-medium text-light-text dark:text-dark-text">
                                    {accountLabel(line.account)}
                                  </span>
                                  <span>
                                    {line.partner
                                      ? `${line.partner.code} · ${line.partner.name}`
                                      : "-"}
                                  </span>
                                  <span>
                                    {line.memo || journal.description || "-"}
                                  </span>
                                  <span className="text-end font-semibold text-emerald-700 dark:text-emerald-300">
                                    {formatMoney(line.debit, language)}
                                  </span>
                                  <span className="text-end font-semibold text-rose-700 dark:text-rose-300">
                                    {formatMoney(line.credit, language)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </TableColumn>
                        </TableRow>
                      </Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </DashboardPanel>
        </ScrollReveal>
      </div>

      <div className="grid items-stretch gap-2 xl:grid-cols-12">
        <ScrollReveal className="xl:col-span-12">
          <DashboardPanel
            title={t("admin.dashboard.ledger.title")}
            description={t("admin.dashboard.ledger.description")}
          >
            <div className="mb-3 grid gap-2 sm:grid-cols-4">
              <DashboardMiniStat
                label={t("admin.dashboard.stats.postedJournals")}
                value={postedJournals}
                tone="success"
              />
              <DashboardMiniStat
                label={t("admin.dashboard.stats.ledgerLines")}
                value={formatAdminNumber(
                  dashboard.ledger.journalLines,
                  language,
                )}
              />
              <DashboardMiniStat
                label={t("admin.dashboard.stats.balances")}
                value={dashboard.ledger.accountBalances}
              />
              <DashboardMiniStat
                label={t("admin.dashboard.stats.partnerLedgers")}
                value={dashboard.ledger.partnerLedgerAccounts}
              />
            </div>
            <div className="overflow-hidden border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface dark:shadow-dark-sm">
              <Table toolbar={ledgerToolbar}>
                <TableHeader headerData={ledgerHeaderData} />
                <TableBody>
                  {ledgerTransactions.length === 0 ? (
                    <DataTableEmptyState
                      colSpan={ledgerHeaderData.length}
                      title={t("admin.dashboard.ledger.empty.title")}
                      description={t(
                        "admin.dashboard.ledger.empty.description",
                      )}
                    />
                  ) : (
                    ledgerTransactions.map((journal) => (
                      <TableRow key={journal.id}>
                        <TableColumn className="text-xs text-muted">
                          {formatAppDate(
                            journal.entryDate,
                            calendarType,
                            language,
                          )}
                        </TableColumn>
                        <TableColumn nowrap={false}>
                          <p className="font-semibold text-light-text dark:text-dark-text">
                            {accountLabel(journal.payerAccount)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted">
                            {t("admin.dashboard.ledger.creditAccount")}
                          </p>
                        </TableColumn>
                        <TableColumn nowrap={false}>
                          <p className="font-semibold text-light-text dark:text-dark-text">
                            {accountLabel(journal.receiverAccount)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted">
                            {t("admin.dashboard.ledger.debitAccount")}
                          </p>
                        </TableColumn>
                        <TableColumn nowrap={false} className="max-w-sm">
                          <p className="font-medium text-light-text dark:text-dark-text">
                            {journal.reason || journal.description || "-"}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">
                            {journal.lines
                              .map((line) => line.memo)
                              .filter(Boolean)
                              .slice(0, 2)
                              .join(" / ") || journal.number}
                          </p>
                        </TableColumn>
                        <TableColumn>
                          <p className="font-medium capitalize text-light-text dark:text-dark-text">
                            {formatOperation(journal.sourceType)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted">
                            {journal.number}
                          </p>
                        </TableColumn>
                        <TableColumn className="">
                          <span className="font-medium tabular-nums text-emerald-700 dark:text-emerald-300">
                            {inlineCurrencyRows(
                              journal.currencyTotals
                                .filter((item) => item.debit !== 0)
                                .map((item) => ({
                                  currencyCode: item.currencyCode,
                                  amount: item.debit,
                                })),
                              language,
                            )}
                          </span>
                        </TableColumn>
                        <TableColumn className="">
                          <span className="font-medium tabular-nums text-rose-700 dark:text-rose-300">
                            {inlineCurrencyRows(
                              journal.currencyTotals
                                .filter((item) => item.credit !== 0)
                                .map((item) => ({
                                  currencyCode: item.currencyCode,
                                  amount: item.credit,
                                })),
                              language,
                            )}
                          </span>
                        </TableColumn>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </DashboardPanel>
        </ScrollReveal>
      </div>
    </div>
  );
}

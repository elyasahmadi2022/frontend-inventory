"use client";

import { AdminPageHeader, ExportButtonGroup } from "@/components/admin/admin-page-header";
import { AdminKpiCard } from "@/components/admin/dashboard/dashboard-panel";
import DataTableEmptyState from "@/components/common/data-table-empty-state";
import { DatePickerField } from "@/components/common/date-picker-field";
import { FormModal } from "@/components/common/form-modal";
import { InputField } from "@/components/common/input-field";
import Pagination from "@/components/common/pagination";
import { SelectField } from "@/components/common/select-field";
import { CurrencyFlagIcon } from "@/components/common/currency-flag-icon";
import Table from "@/components/common/table";
import TableBody from "@/components/common/table-body";
import TableColumn from "@/components/common/table-column";
import TableHeader from "@/components/common/table-header";
import TableRow from "@/components/common/table-row";
import TableToolbar from "@/components/common/table-tool-bar";
import TooltipComponent from "@/context/TooltipContext";
import { toPaginationMeta } from "@/lib/admin/pagination-meta";
import { ApiError } from "@/lib/api";
import { getLocalDateString, toIsoDate } from "@/lib/date-format";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import {
  useAdminAccountBalancesQuery,
  useAdminAccountLedgerQuery,
  useAdminAccountsQuery,
  useAdminBalanceSheetQuery,
  useAdminCashBalancesQuery,
  useAdminCurrenciesQuery,
  useAdminFinancialSummaryQuery,
  useAdminIncomeStatementQuery,
  useAdminInventoryBalancesQuery,
  useAdminJournalReportQuery,
  useAdminMonthlyReportQuery,
  useStoreSettingsQuery,
} from "@/lib/query/hooks";
import { APP_NAME } from "@/utils/constants";
import type { CurrencyCode } from "@/services/accounts.service";
import type {
  AccountLedgerResult,
  JournalEntryRow,
  JournalSourceType,
  JournalStatus,
  PartnerBalanceRow,
  StatementAccountRow,
} from "@/services/reports-admin.service";
import { fetchAccountLedger, fetchJournalReport } from "@/services/reports-admin.service";
import { gooeyToast } from "goey-toast";
import {
  BadgeDollarSign,
  BookOpenText,
  Boxes,
  CircleHelp,
  Landmark,
  ReceiptText,
  RefreshCcw,
  Scale,
  TrendingDown,
  TrendingUp,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ReportTab =
  | "journal"
  | "monthly"
  | "ledger"
  | "income"
  | "position"
  | "summary"
  | "balances";

const today = getLocalDateString();
const monthStart = toIsoDate(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1),
);

function twoDigit(value: string | number) {
  return String(value).padStart(2, "0");
}

function monthRange(year: string, month: string) {
  const parsedYear = Number(year);
  const parsedMonth = Number(month);
  const lastDay = new Date(parsedYear, parsedMonth, 0).getDate();

  return {
    from: `${parsedYear}-${twoDigit(parsedMonth)}-01`,
    to: `${parsedYear}-${twoDigit(parsedMonth)}-${twoDigit(lastDay)}`,
  };
}

function numberLabel(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed.toLocaleString() : "0";
}

function absoluteNumberLabel(value: string | number | null | undefined) {
  return numberLabel(Math.abs(Number(value ?? 0)));
}

function dateLabel(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

function optionLabel(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "-";
}

function userLabel(
  user?: { fullName?: string | null; username?: string | null } | null,
) {
  return user?.fullName ?? user?.username ?? "-";
}

function currencyNettedTotals(
  lines:
    | Array<{
        currencyCode?: CurrencyCode;
        debit?: string | number;
        credit?: string | number;
        account?: { id?: string } | null;
      }>
    | undefined,
  field: "debit" | "credit",
) {
  const accountTotals = new Map<
    string,
    { currencyCode: string; net: number }
  >();
  (lines ?? []).forEach((line, index) => {
    const currencyCode = line.currencyCode ?? "BASE";
    const key = `${currencyCode}:${line.account?.id ?? index}`;
    const current = accountTotals.get(key) ?? { currencyCode, net: 0 };
    current.net += Number(line.debit ?? 0) - Number(line.credit ?? 0);
    accountTotals.set(key, current);
  });
  const totals = new Map<string, number>();
  accountTotals.forEach((item) => {
    const amount =
      field === "debit" ? Math.max(item.net, 0) : Math.max(-item.net, 0);
    totals.set(
      item.currencyCode,
      (totals.get(item.currencyCode) ?? 0) + amount,
    );
  });
  return [...totals.entries()]
    .filter(([, total]) => total !== 0)
    .map(([currencyCode, total]) => ({ currencyCode, total }));
}

function visibleJournalTotals(
  journals: Array<{ lines?: Parameters<typeof currencyNettedTotals>[0] }>,
  field: "debit" | "credit",
) {
  const totals = new Map<string, number>();
  journals.forEach((journal) => {
    currencyNettedTotals(journal.lines, field).forEach((item) => {
      totals.set(
        item.currencyCode,
        (totals.get(item.currencyCode) ?? 0) + item.total,
      );
    });
  });
  return [...totals.entries()].map(([currencyCode, total]) => ({
    currencyCode,
    total,
  }));
}

function amountToneClass(
  value: number,
  kind: "positive" | "negative" | "neutral" = "neutral",
) {
  if (kind === "positive") return "text-emerald-700 dark:text-emerald-400";
  if (kind === "negative") return "text-rose-700 dark:text-rose-400";
  return value < 0
    ? "text-rose-700 dark:text-rose-400"
    : value > 0
      ? "text-emerald-700 dark:text-emerald-400"
      : "text-sky-700 dark:text-sky-400";
}

function badgeToneClass(
  tone: "success" | "danger" | "warning" | "info" | "neutral",
) {
  if (tone === "success")
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
  if (tone === "danger")
    return "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400";
  if (tone === "warning")
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";
  if (tone === "info")
    return "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400";
  return "bg-light-border text-light-text dark:bg-dark-border dark:text-dark-text";
}

function TonePill({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "danger" | "warning" | "info" | "neutral";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeToneClass(tone)}`}
    >
      {label}
    </span>
  );
}

function AccountingTerm({ label, help }: { label: string; help: string }) {
  return (
    <TooltipComponent content={help} side="top">
      <span
        tabIndex={0}
        className="inline-flex cursor-help items-center gap-1 outline-none focus-visible:text-primary-600"
      >
        <span>{label}</span>
        <CircleHelp className="size-3.5 shrink-0 opacity-65" aria-hidden />
      </span>
    </TooltipComponent>
  );
}

function CurrencyTotals({
  totals,
  kind,
}: {
  totals: Array<{ currencyCode: string; total: number }>;
  kind: "positive" | "negative";
}) {
  if (totals.length === 0)
    return <span className="text-light-muted dark:text-dark-muted">0</span>;
  return (
    <span className="flex min-w-0 flex-col items-start gap-1 text-sm">
      {totals.map((item) => (
        <span
          key={`${kind}-${item.currencyCode}`}
          className={`flex w-full items-center gap-1.5 whitespace-nowrap font-semibold ${
            kind === "positive"
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-rose-700 dark:text-rose-400"
          }`}
        >
          <CurrencyFlagIcon
            currency={item.currencyCode}
            className="h-4 w-6 shrink-0"
          />
          <span className="tabular-nums">
            {absoluteNumberLabel(item.total)}
          </span>
          <span className="text-[10px] font-medium opacity-70">
            {item.currencyCode}
          </span>
        </span>
      ))}
    </span>
  );
}

function groupedAmounts(
  rows: Array<{
    currencyCode?: string | null;
    amount?: string | number | null;
  }>,
) {
  const totals = new Map<string, number>();
  rows.forEach((row) => {
    const currencyCode = row.currencyCode ?? "BASE";
    totals.set(
      currencyCode,
      (totals.get(currencyCode) ?? 0) + Number(row.amount ?? 0),
    );
  });
  return [...totals.entries()].map(([currencyCode, total]) => ({
    currencyCode,
    total,
  }));
}

function CurrencyValueRows({
  totals,
}: {
  totals: Array<{ currencyCode: string; total: number }>;
}) {
  if (totals.length === 0) return <span>0</span>;
  return (
    <span className="flex flex-col gap-1 text-sm font-semibold">
      {totals.map((item) => (
        <span
          key={item.currencyCode}
          className="inline-flex items-center gap-1.5"
        >
          <CurrencyFlagIcon currency={item.currencyCode} className="h-4 w-6" />
          {numberLabel(item.total)}
          <span className="sr-only">{item.currencyCode}</span>
        </span>
      ))}
    </span>
  );
}

function ProfitLossCurrencyRows({
  totals,
}: {
  totals: Array<{ currencyCode: string; total: number }>;
}) {
  const { t } = useI18n();
  if (totals.length === 0) return <span>0</span>;
  return (
    <span className="flex flex-col gap-1.5 text-xs font-semibold">
      {totals.map((item) => {
        const isProfit = item.total >= 0;
        return (
          <span
            key={item.currencyCode}
            className="flex items-center justify-between gap-3"
          >
            <span className="inline-flex items-center gap-1.5">
              <CurrencyFlagIcon
                currency={item.currencyCode}
                className="h-4 w-6"
              />
              <span>{item.currencyCode}</span>
            </span>
            <span
              className={
                isProfit
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-rose-700 dark:text-rose-400"
              }
            >
              {numberLabel(Math.abs(item.total))} ·{" "}
              {isProfit
                ? t("admin.reports.monthly.profit")
                : t("admin.reports.monthly.loss")}
            </span>
          </span>
        );
      })}
    </span>
  );
}

const monthlyCurrencyColors = [
  "#0066ff",
  "#047857",
  "#d97706",
  "#7c3aed",
  "#be123c",
];

let monthlyReportFontPromise: Promise<string> | null = null;

async function getMonthlyReportFont() {
  if (!monthlyReportFontPromise) {
    monthlyReportFontPromise = fetch("/fonts/NotoNaskhArabic-Regular.ttf")
      .then(async (response) => {
        if (!response.ok) throw new Error("Monthly report font is unavailable");
        const bytes = new Uint8Array(await response.arrayBuffer());
        let binary = "";
        for (let start = 0; start < bytes.length; start += 0x8000) {
          binary += String.fromCharCode(
            ...bytes.subarray(start, start + 0x8000),
          );
        }
        return window.btoa(binary);
      })
      .catch((error) => {
        monthlyReportFontPromise = null;
        throw error;
      });
  }
  return monthlyReportFontPromise;
}

function BaseCurrencyValue({
  value,
  currencyCode,
}: {
  value?: string | number | null;
  currencyCode: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <CurrencyFlagIcon currency={currencyCode} className="h-4 w-6" />
      {numberLabel(value)}
      <span className="sr-only">{currencyCode}</span>
    </span>
  );
}

type MonthlyChartEntry = {
  name: string;
  nativeValues: Array<{ currencyCode: string; total: number }>;
  values: Record<string, number>;
  valueKind?: "profit-loss";
};

function MonthlyChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: MonthlyChartEntry }>;
}) {
  const { t } = useI18n();
  const entry = payload?.[0]?.payload;
  if (!active || !entry) return null;

  return (
    <div className="min-w-48 border border-light-border bg-light-surface p-3 text-xs shadow-lg dark:border-dark-border dark:bg-dark-surface">
      <p className="mb-2 font-semibold text-light-text dark:text-dark-text">
        {entry.name}
      </p>
      <div className="space-y-1.5">
        {entry.nativeValues.length > 0 ? (
          entry.nativeValues.map((item) => (
            <div
              key={item.currencyCode}
              className="flex items-center justify-between gap-4"
            >
              <span className="inline-flex items-center gap-1.5 text-light-muted dark:text-dark-muted">
                <CurrencyFlagIcon
                  currency={item.currencyCode}
                  className="h-4 w-6"
                />
                {item.currencyCode}
              </span>
              <span className="font-semibold tabular-nums text-light-text dark:text-dark-text">
                {entry.valueKind === "profit-loss"
                  ? `${numberLabel(Math.abs(item.total))} · ${item.total >= 0 ? t("admin.reports.monthly.profit") : t("admin.reports.monthly.loss")}`
                  : numberLabel(item.total)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-light-muted dark:text-dark-muted">
            {t("admin.reports.monthly.noCurrencyActivity")}
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryExposureTable({
  rows,
  title,
  emptyTitle,
  tone,
}: {
  rows: PartnerBalanceRow[];
  title: string;
  emptyTitle: string;
  tone: "incoming" | "outgoing";
}) {
  const { t } = useI18n();
  return (
    <Table
      toolbar={
        <TableToolbar>
          <TableToolbar.Row>
            <span className="text-sm font-semibold text-light-text dark:text-dark-text">
              {title}
            </span>
          </TableToolbar.Row>
        </TableToolbar>
      }
    >
      <TableHeader
        headerData={[
          {
            title: t("admin.reports.column.partner"),
            tooltip: t("admin.reports.columnHelp.partner"),
          },
          {
            title: t("admin.partners.details.accountMeaning"),
            tooltip: t("admin.reports.columnHelp.accountMeaning"),
          },
          {
            title: t("admin.reports.column.currency"),
            tooltip: t("admin.reports.columnHelp.currency"),
          },
          {
            title: t("admin.reports.column.totalAmount"),
            tooltip: t("admin.reports.columnHelp.totalAmount"),
          },
          {
            title: t("admin.partners.details.settledAmount"),
            tooltip: t("admin.reports.columnHelp.settledAmount"),
          },
          {
            title: t("admin.partners.details.outstandingAmount"),
            tooltip: t("admin.reports.columnHelp.outstandingAmount"),
          },
        ]}
      />
      <TableBody>
        {rows.length === 0 ? (
          <DataTableEmptyState colSpan={6} title={emptyTitle} />
        ) : (
          rows.map((row, index) => (
            <TableRow
              key={`${row.partner?.id ?? "partner"}-${row.currencyCode}-${index}`}
              className={tone === "incoming" ? "" : ""}
            >
              <TableColumn>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {row.partner?.name ?? "-"}
                  </span>
                  <span className="text-xs text-light-muted dark:text-dark-muted">
                    {row.partner?.code ?? "-"}
                  </span>
                </div>
              </TableColumn>
              <TableColumn nowrap={false}>
                {Math.abs(Number(row.balance ?? 0)) > 0
                  ? tone === "incoming"
                    ? t("admin.partners.details.receivablePlain")
                    : t("admin.partners.details.payablePlain")
                  : t("admin.partners.details.settledPlain")}
              </TableColumn>
              <TableColumn>{row.currencyCode}</TableColumn>
              <TableColumn className="">
                {tone === "incoming"
                  ? absoluteNumberLabel(row.debitTotal)
                  : absoluteNumberLabel(row.creditTotal)}
              </TableColumn>
              <TableColumn className="">
                {tone === "incoming"
                  ? absoluteNumberLabel(row.creditTotal)
                  : absoluteNumberLabel(row.debitTotal)}
              </TableColumn>
              <TableColumn className="">
                <span
                  className={`font-semibold ${amountToneClass(Number(row.balance ?? 0))}`}
                >
                  {absoluteNumberLabel(row.balance)}
                </span>
              </TableColumn>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function CombinedStatementTable({
  rows,
  title,
  emptyTitle,
  onOpenLedger,
}: {
  rows: Array<StatementAccountRow & { section: "revenue" | "expense" }>;
  title: string;
  emptyTitle: string;
  onOpenLedger: (accountId: string) => void;
}) {
  const { t } = useI18n();

  return (
    <Table
      toolbar={
        <TableToolbar>
          <TableToolbar.Row>
            <span className="text-sm font-semibold text-light-text dark:text-dark-text">
              {title}
            </span>
          </TableToolbar.Row>
        </TableToolbar>
      }
    >
      <TableHeader
        headerData={[
          {
            title: t("admin.reports.column.type"),
            tooltip: t("admin.reports.columnHelp.type"),
          },
          {
            title: t("admin.reports.column.account"),
            tooltip: t("admin.reports.columnHelp.account"),
          },
          {
            title: t("admin.reports.column.currency"),
            tooltip: t("admin.reports.columnHelp.currency"),
          },
          {
            title: t("admin.reports.column.totalAmount"),
            tooltip: t("admin.reports.columnHelp.totalAmount"),
            align: "end" as const,
          },
        ]}
      />
      <TableBody>
        {rows.length === 0 ? (
          <DataTableEmptyState colSpan={4} title={emptyTitle} />
        ) : (
          rows.map((row) => (
            <TableRow
              key={`${row.section}-${row.account.id}-${row.currencyCode ?? ""}`}
            >
              <TableColumn>
                <TonePill
                  label={
                    row.section === "revenue"
                      ? t("admin.reports.income.revenue")
                      : t("admin.reports.income.expenses")
                  }
                  tone={row.section === "revenue" ? "success" : "danger"}
                />
              </TableColumn>
              <TableColumn>
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => onOpenLedger(row.account.id)}
                    className="w-fit text-start font-medium text-primary-700 underline-offset-2 hover:underline dark:text-primary-300"
                    title={t("admin.reports.income.viewLedger")}
                  >
                    {row.account.name}
                  </button>
                  <span className="text-xs text-light-muted dark:text-dark-muted">
                    {row.account.code} / {optionLabel(row.account.type)}
                  </span>
                </div>
              </TableColumn>
              <TableColumn>
                <span className="inline-flex items-center gap-1.5">
                  <CurrencyFlagIcon
                    currency={row.currencyCode ?? "AFN"}
                    className="h-4 w-6"
                  />
                  <span>{row.currencyCode ?? "-"}</span>
                </span>
              </TableColumn>
              <TableColumn className="">
                <button
                  type="button"
                  onClick={() => onOpenLedger(row.account.id)}
                  title={t("admin.reports.income.viewLedger")}
                  className={`${row.section === "revenue" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"} font-semibold underline-offset-2 hover:underline`}
                >
                  {absoluteNumberLabel(row.balance)}
                </button>
              </TableColumn>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export function AdminReportsContent() {
  const { t } = useI18n();
  const { user } = useAuth();
  const now = new Date();
  const [activeTab, setActiveTab] = useState<ReportTab>("monthly");
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [journalPage, setJournalPage] = useState(1);
  const [journalPageSize, setJournalPageSize] = useState(10);
  const [journalStatus, setJournalStatus] = useState<JournalStatus | "all">(
    "posted",
  );
  const [journalSourceType, setJournalSourceType] = useState<
    JournalSourceType | "all"
  >("all");
  const [journalCurrency, setJournalCurrency] = useState<CurrencyCode | "all">(
    "all",
  );
  const [journalNumber, setJournalNumber] = useState("");
  const [monthlyExportFormat, setMonthlyExportFormat] = useState<
    "pdf" | "excel" | null
  >(null);
  const [isExportingMonthlyReport, setIsExportingMonthlyReport] =
    useState(false);
  const [ledgerExportFormat, setLedgerExportFormat] = useState<
    "pdf" | "excel" | null
  >(null);
  const [ledgerExportData, setLedgerExportData] =
    useState<AccountLedgerResult | null>(null);
  const [isPreparingLedgerExport, setIsPreparingLedgerExport] = useState(false);
  const [isExportingLedgerReport, setIsExportingLedgerReport] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(10);
  const accountsQuery = useAdminAccountsQuery({ isActive: true, limit: 100 });
  const currenciesQuery = useAdminCurrenciesQuery();
  const storeSettingsQuery = useStoreSettingsQuery();
  const accountBalancesQuery = useAdminAccountBalancesQuery();
  const firstAccountId =
    accountsQuery.data?.[0]?.id ??
    accountBalancesQuery.data?.find((row) => row.account?.id)?.account?.id ??
    "";
  const [ledgerAccountId, setLedgerAccountId] = useState("");
  const selectedLedgerAccountId = ledgerAccountId || firstAccountId;

  const selectedMonthRange = useMemo(
    () => monthRange(year, month),
    [month, year],
  );
  const monthlyQuery = useAdminMonthlyReportQuery(Number(year), Number(month));
  const monthlyFinancialSummaryQuery =
    useAdminFinancialSummaryQuery(selectedMonthRange);
  const monthlyIncomeStatementQuery =
    useAdminIncomeStatementQuery(selectedMonthRange);
  const monthlyBalanceSheetQuery = useAdminBalanceSheetQuery(
    selectedMonthRange.to,
  );
  const journalQuery = useAdminJournalReportQuery({
    page: journalPage,
    limit: journalPageSize,
    from: fromDate,
    to: toDate,
    status: journalStatus === "all" ? undefined : journalStatus,
    sourceType: journalSourceType === "all" ? undefined : journalSourceType,
    currencyCode: journalCurrency === "all" ? undefined : journalCurrency,
    number: journalNumber.trim() || undefined,
  });
  const ledgerQuery = useAdminAccountLedgerQuery(
    {
      page: ledgerPage,
      limit: ledgerPageSize,
      accountId: selectedLedgerAccountId,
      from: fromDate,
      to: toDate,
    },
    Boolean(selectedLedgerAccountId),
  );
  const financialSummaryQuery = useAdminFinancialSummaryQuery({
    from: fromDate,
    to: toDate,
  });
  const incomeStatementQuery = useAdminIncomeStatementQuery({
    from: fromDate,
    to: toDate,
  });
  const balanceSheetQuery = useAdminBalanceSheetQuery(toDate);
  const cashBalancesQuery = useAdminCashBalancesQuery();
  const inventoryBalancesQuery = useAdminInventoryBalancesQuery();
  const baseCurrency =
    currenciesQuery.data?.find((currency) => currency.isBase)?.code ?? "AFN";
  const reportSystemName = storeSettingsQuery.data?.storeName || APP_NAME;
  const reportPreparedBy =
    user?.fullName ??
    user?.full_name ??
    user?.name ??
    user?.username ??
    user?.email ??
    "-";

  useEffect(() => {
    const error =
      monthlyQuery.error ??
      monthlyFinancialSummaryQuery.error ??
      monthlyIncomeStatementQuery.error ??
      monthlyBalanceSheetQuery.error ??
      ledgerQuery.error ??
      financialSummaryQuery.error ??
      incomeStatementQuery.error ??
      balanceSheetQuery.error ??
      accountsQuery.error ??
      accountBalancesQuery.error ??
      cashBalancesQuery.error ??
      inventoryBalancesQuery.error;
    if (!error) return;
    gooeyToast.error(t("admin.reports.toast.loadFailedTitle"), {
      description:
        error instanceof ApiError
          ? error.message
          : t("admin.reports.toast.loadFailedFallback"),
    });
  }, [
    accountBalancesQuery.error,
    accountsQuery.error,
    cashBalancesQuery.error,
    balanceSheetQuery.error,
    financialSummaryQuery.error,
    incomeStatementQuery.error,
    inventoryBalancesQuery.error,
    ledgerQuery.error,
    monthlyBalanceSheetQuery.error,
    monthlyFinancialSummaryQuery.error,
    monthlyIncomeStatementQuery.error,
    monthlyQuery.error,
    t,
  ]);

  const monthlyFinancialSummary = monthlyFinancialSummaryQuery.data;
  const monthlyIncomeStatement = monthlyIncomeStatementQuery.data;
  const monthlyBalanceSheet = monthlyBalanceSheetQuery.data;
  const financialSummary = financialSummaryQuery.data;
  const incomeStatement = incomeStatementQuery.data;
  const balanceSheet = balanceSheetQuery.data;
  const accountBalances = useMemo(
    () => accountBalancesQuery.data ?? [],
    [accountBalancesQuery.data],
  );
  const cashBalances = useMemo(
    () => cashBalancesQuery.data ?? [],
    [cashBalancesQuery.data],
  );
  const inventoryBalances = inventoryBalancesQuery.data ?? [];
  const cashCurrencyTotals = useMemo(
    () =>
      groupedAmounts(
        cashBalances.map((row) => ({
          currencyCode: row.currencyCode,
          amount: row.balance,
        })),
      ),
    [cashBalances],
  );
  const accountBalanceCurrencyTotals = useMemo(
    () =>
      groupedAmounts(
        accountBalances.map((row) => ({
          currencyCode: row.currencyCode,
          amount: row.balance,
        })),
      ),
    [accountBalances],
  );
  const receivableCurrencyTotals = useMemo(
    () =>
      groupedAmounts(
        (financialSummary?.receivables.rows ?? []).map((row) => ({
          currencyCode: row.currencyCode,
          amount: row.balance,
        })),
      ),
    [financialSummary],
  );
  const payableCurrencyTotals = useMemo(
    () =>
      groupedAmounts(
        (financialSummary?.payables.rows ?? []).map((row) => ({
          currencyCode: row.currencyCode,
          amount: row.balance,
        })),
      ),
    [financialSummary],
  );
  const incomeRows = useMemo(
    () => [
      ...(incomeStatement?.revenue ?? []).map((row) => ({
        ...row,
        section: "revenue" as const,
      })),
      ...(incomeStatement?.expenses ?? []).map((row) => ({
        ...row,
        section: "expense" as const,
      })),
    ],
    [incomeStatement],
  );
  const tabs = useMemo(
    () => [
      {
        id: "journal",
        label: t("admin.reports.tabs.journal"),
        icon: <ReceiptText className="size-4" />,
      },
      {
        id: "monthly",
        label: t("admin.reports.monthly.title"),
        icon: <Boxes className="size-4" />,
      },
      {
        id: "ledger",
        label: t("admin.reports.tabs.ledger"),
        icon: <BookOpenText className="size-4" />,
      },
      {
        id: "income",
        label: t("admin.reports.tabs.income"),
        icon: <TrendingUp className="size-4" />,
      },
      {
        id: "position",
        label: t("admin.reports.tabs.position"),
        icon: <Scale className="size-4" />,
      },
      {
        id: "summary",
        label: t("admin.reports.tabs.summary"),
        icon: <Scale className="size-4" />,
      },
      {
        id: "balances",
        label: t("admin.reports.tabs.balances"),
        icon: <Landmark className="size-4" />,
      },
    ],
    [t],
  );
  const accountOptions = useMemo(() => {
    const options = new Map<
      string,
      { value: string; label: string; searchText: string }
    >();
    (accountsQuery.data ?? []).forEach((account) => {
      options.set(account.id, {
        value: account.id,
        label: `${account.code} - ${account.name}`,
        searchText: `${account.code} ${account.name} ${account.type}`,
      });
    });
    accountBalances.forEach((row) => {
      if (!row.account?.id || options.has(row.account.id)) return;
      options.set(row.account.id, {
        value: row.account.id,
        label: `${row.account.code} - ${row.account.name}`,
        searchText: `${row.account.code} ${row.account.name} ${row.account.type}`,
      });
    });
    return [...options.values()];
  }, [accountBalances, accountsQuery.data]);
  const statusOptions = [
    { value: "all", label: t("admin.reports.filter.allStatuses") },
    { value: "posted", label: t("admin.reports.status.posted") },
    { value: "draft", label: t("admin.reports.status.draft") },
    { value: "reversed", label: t("admin.reports.status.reversed") },
    { value: "voided", label: t("admin.reports.status.voided") },
  ];
  const sourceOptions = [
    { value: "all", label: t("admin.reports.filter.allSources") },
    { value: "manual", label: t("admin.reports.source.manual") },
    { value: "sale", label: t("admin.reports.source.sale") },
    { value: "purchase", label: t("admin.reports.source.purchase") },
    { value: "payment", label: t("admin.reports.source.payment") },
    { value: "money_transfer", label: t("admin.reports.source.moneyTransfer") },
    {
      value: "inventory_adjustment",
      label: t("admin.reports.source.inventoryAdjustment"),
    },
    {
      value: "opening_balance",
      label: t("admin.reports.source.openingBalance"),
    },
  ];
  const currencyOptions = [
    { value: "all", label: t("admin.reports.filter.allCurrencies") },
    { value: "AFN", label: "AFN" },
    { value: "USD", label: "USD" },
    { value: "PKR", label: "PKR" },
  ];
  const monthOptions = Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1),
    label: String(index + 1),
  }));
  const yearOptions = Array.from({ length: 11 }, (_, index) => {
    const value = String(now.getFullYear() - 5 + index);
    return { value, label: value };
  });
  const monthlyChartData = useMemo(() => {
    const incomeNative = monthlyIncomeStatement?.nativeTotals ?? [];
    const positionNative = monthlyBalanceSheet?.nativeTotals ?? [];
    const chartEntry = (
      name: string,
      nativeValues: Array<{ currencyCode: string; total: number }>,
      valueKind?: "profit-loss",
    ): MonthlyChartEntry => ({
      name,
      nativeValues,
      values: Object.fromEntries(
        nativeValues.map((item) => [item.currencyCode, item.total]),
      ),
      valueKind,
    });

    return [
      chartEntry(
        t("admin.reports.summary.revenue"),
        incomeNative.map((row) => ({
          currencyCode: row.currencyCode,
          total: Number(row.revenue),
        })),
      ),
      chartEntry(
        t("admin.reports.summary.expenses"),
        incomeNative.map((row) => ({
          currencyCode: row.currencyCode,
          total: Number(row.expenses),
        })),
      ),
      chartEntry(
        t("admin.reports.stats.profitLoss"),
        incomeNative.map((row) => ({
          currencyCode: row.currencyCode,
          total: Number(row.net),
        })),
        "profit-loss",
      ),
      chartEntry(
        t("admin.reports.position.assets"),
        positionNative.map((row) => ({
          currencyCode: row.currencyCode,
          total: Number(row.assets),
        })),
      ),
      chartEntry(
        t("admin.reports.position.liabilities"),
        positionNative.map((row) => ({
          currencyCode: row.currencyCode,
          total: Number(row.liabilities),
        })),
      ),
      chartEntry(
        t("admin.reports.position.equity"),
        positionNative.map((row) => ({
          currencyCode: row.currencyCode,
          total: Number(row.equity),
        })),
      ),
      chartEntry(
        t("admin.reports.stats.receivables"),
        groupedAmounts(
          (monthlyFinancialSummary?.receivables.rows ?? []).map((row) => ({
            currencyCode: row.currencyCode,
            amount: row.balance,
          })),
        ),
      ),
      chartEntry(
        t("admin.reports.stats.payables"),
        groupedAmounts(
          (monthlyFinancialSummary?.payables.rows ?? []).map((row) => ({
            currencyCode: row.currencyCode,
            amount: row.balance,
          })),
        ),
      ),
    ] satisfies MonthlyChartEntry[];
  }, [monthlyBalanceSheet, monthlyFinancialSummary, monthlyIncomeStatement, t]);
  const monthlyChartCurrencies = useMemo(
    () => [
      ...new Set(
        monthlyChartData.flatMap((entry) =>
          entry.nativeValues.map((item) => item.currencyCode),
        ),
      ),
    ],
    [monthlyChartData],
  );
  const monthlyExportRows = useMemo(
    () =>
      monthlyChartData.map((entry) => ({
        metric: entry.name,
        values: Object.fromEntries(
          monthlyChartCurrencies.map((currencyCode) => [
            currencyCode,
            Number(entry.values[currencyCode] ?? 0),
          ]),
        ),
      })),
    [monthlyChartCurrencies, monthlyChartData],
  );
  const ledgerExportGroups = useMemo(() => {
    const groups = new Map<
      string,
      NonNullable<typeof ledgerExportData>["items"]
    >();
    (ledgerExportData?.items ?? []).forEach((line) => {
      const currency = line.currencyCode ?? baseCurrency;
      groups.set(currency, [...(groups.get(currency) ?? []), line]);
    });
    return [...groups.entries()];
  }, [baseCurrency, ledgerExportData]);

  const prepareLedgerExport = async (format: "pdf" | "excel") => {
    if (!selectedLedgerAccountId) return;
    setIsPreparingLedgerExport(true);
    try {
      const params = {
        accountId: selectedLedgerAccountId,
        from: fromDate,
        to: toDate,
        page: 1,
        limit: 100,
      };
      const data = await fetchAccountLedger(params);
      const allItems = [...data.items];
      for (
        let page = 2;
        data.pagination?.hasNextPage && page <= data.pagination.totalPages;
        page += 1
      ) {
        const nextPage = await fetchAccountLedger({ ...params, page });
        allItems.push(...nextPage.items);
      }
      setLedgerExportData({ ...data, items: allItems });
      setLedgerExportFormat(format);
    } catch {
      gooeyToast.error(t("admin.reports.monthly.exportFailed"));
    } finally {
      setIsPreparingLedgerExport(false);
    }
  };

  const downloadLedgerReport = async () => {
    if (!ledgerExportFormat || !ledgerExportData) return;
    setIsExportingLedgerReport(true);
    const headers = [
      t("admin.reports.column.date"),
      t("admin.reports.column.journal"),
      t("admin.reports.column.description"),
      t("admin.reports.column.partner"),
      t("admin.reports.column.debit"),
      t("admin.reports.column.credit"),
      t("admin.reports.column.balance"),
    ];
    const fileName = `ledger-${ledgerExportData.account?.code ?? "report"}-${fromDate}-${toDate}`;
    try {
      let blob: Blob;
      let extension: "pdf" | "xlsx";
      if (ledgerExportFormat === "excel") {
        const XLSX = await import("xlsx");
        const workbook = XLSX.utils.book_new();
        ledgerExportGroups.forEach(([currency, lines]) => {
          const rows = lines.map((line) => [
            dateLabel(line.journalEntry?.entryDate),
            line.journalEntry?.number ?? "-",
            line.journalEntry?.description ?? line.memo ?? "-",
            line.partner?.name ?? "-",
            Number(line.debit ?? 0),
            Number(line.credit ?? 0),
            Number(line.runningBalance ?? 0),
          ]);
          const sheet = XLSX.utils.aoa_to_sheet([
            [reportSystemName],
            [t("admin.reports.tabs.ledger")],
            [`${t("admin.reports.export.preparedBy")}: ${reportPreparedBy}`],
            [
              `${t("admin.reports.export.filters")}: ${ledgerExportData.account?.code ?? "-"} | ${fromDate} — ${toDate} | ${currency}`,
            ],
            [],
            headers,
            ...rows,
          ]);
          sheet["!cols"] = [
            { wch: 14 },
            { wch: 16 },
            { wch: 36 },
            { wch: 22 },
            { wch: 14 },
            { wch: 14 },
            { wch: 16 },
          ];
          XLSX.utils.book_append_sheet(workbook, sheet, currency.slice(0, 31));
        });
        blob = new Blob(
          [XLSX.write(workbook, { bookType: "xlsx", type: "array" })],
          {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        );
        extension = "xlsx";
      } else {
        const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
          import("jspdf"),
          import("html2canvas"),
        ]);
        const document = new jsPDF({ orientation: "landscape" });
        const fontData = await getMonthlyReportFont();
        document.addFileToVFS("NotoNaskhArabic.ttf", fontData);
        document.addFont("NotoNaskhArabic.ttf", "NotoNaskhArabic", "normal");
        for (const [index, [currency, lines]] of ledgerExportGroups.entries()) {
          if (index) document.addPage();
          const header = window.document.createElement("div");
          header.dir = window.document.documentElement.dir;
          header.style.cssText =
            "position:fixed;left:-10000px;top:0;width:1200px;padding:24px;background:#ffffff;color:#182230;font-family:var(--font-locale),sans-serif;";
          [
            [reportSystemName, "24px"],
            [
              `${t("admin.reports.tabs.ledger")} — ${ledgerExportData.account?.code ?? "-"} (${currency})`,
              "18px",
            ],
            [
              `${t("admin.reports.export.preparedBy")}: ${reportPreparedBy} | ${t("admin.reports.export.filters")}: ${fromDate} — ${toDate}`,
              "14px",
            ],
          ].forEach(([text, fontSize]) => {
            const line = window.document.createElement("p");
            line.textContent = text;
            line.style.cssText = `margin:0 0 6px;font-size:${fontSize};`;
            header.appendChild(line);
          });
          window.document.body.appendChild(header);
          const headerCanvas = await html2canvas(header, {
            backgroundColor: "#ffffff",
            scale: 2,
          });
          header.remove();
          document.addImage(
            headerCanvas.toDataURL("image/png"),
            "PNG",
            14,
            10,
            269,
            (headerCanvas.height / headerCanvas.width) * 269,
          );
          for (let start = 0; start < lines.length; start += 24) {
            if (start) document.addPage();
            const table = window.document.createElement("table");
            table.dir = window.document.documentElement.dir;
            table.style.cssText =
              "position:fixed;left:-10000px;top:0;width:1200px;border-collapse:collapse;background:#fff;color:#182230;font:14px var(--font-locale),sans-serif;";
            const head = table.insertRow();
            headers.forEach((label) => {
              const cell = window.document.createElement("th");
              cell.textContent = label;
              cell.style.cssText =
                "padding:8px;border:1px solid #cbd5e1;background:#0066ff;color:white;text-align:start;";
              head.appendChild(cell);
            });
            lines.slice(start, start + 24).forEach((line) => {
              const row = table.insertRow();
              [
                dateLabel(line.journalEntry?.entryDate),
                line.journalEntry?.number ?? "-",
                line.journalEntry?.description ?? line.memo ?? "-",
                line.partner?.name ?? "-",
                numberLabel(line.debit),
                numberLabel(line.credit),
                numberLabel(line.runningBalance),
              ].forEach((value) => {
                const cell = row.insertCell();
                cell.textContent = value;
                cell.style.cssText =
                  "padding:7px;border:1px solid #cbd5e1;text-align:start;";
              });
            });
            window.document.body.appendChild(table);
            const tableCanvas = await html2canvas(table, {
              backgroundColor: "#ffffff",
              scale: 2,
            });
            table.remove();
            document.addImage(
              tableCanvas.toDataURL("image/png"),
              "PNG",
              14,
              43,
              269,
              (tableCanvas.height / tableCanvas.width) * 269,
            );
          }
        }
        blob = document.output("blob");
        extension = "pdf";
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setLedgerExportFormat(null);
      gooeyToast.success(t("admin.reports.monthly.exportSuccess"));
    } catch {
      gooeyToast.error(t("admin.reports.monthly.exportFailed"));
    } finally {
      setIsExportingLedgerReport(false);
    }
  };

  const downloadMonthlyReport = async () => {
    if (!monthlyExportFormat) return;

    setIsExportingMonthlyReport(true);
    const fileName = `monthly-report-${selectedMonthRange.from}`;
    const headers = [
      t("admin.reports.monthly.exportMetric"),
      ...monthlyChartCurrencies,
    ];
    const dataRows = monthlyExportRows.map((row) => [
      row.metric,
      ...monthlyChartCurrencies.map((currencyCode) => row.values[currencyCode]),
    ]);

    // Fetch detailed transaction data for the selected month
    let allJournalEntries: JournalEntryRow[] = [];
    try {
      const params = {
        from: selectedMonthRange.from,
        to: selectedMonthRange.to,
        status: "posted" as JournalStatus,
        page: 1,
        limit: 100,
      };
      const firstPage = await fetchJournalReport(params);
      allJournalEntries = [...firstPage.items];
      
      // Fetch remaining pages if any
      if (firstPage.pagination?.hasNextPage) {
        const totalPages = firstPage.pagination.totalPages || 1;
        for (let page = 2; page <= totalPages; page++) {
          const nextPage = await fetchJournalReport({ ...params, page });
          allJournalEntries.push(...nextPage.items);
        }
      }
    } catch (error) {
      console.error("Failed to fetch journal entries:", error);
      // Continue with export even if journal data fails
    }

    // Organize transactions by type
    const salesTransactions = allJournalEntries.filter(
      (journal) => journal.sourceType === "sale" || journal.movements?.some(m => m.type === "return_out")
    );
    const purchaseTransactions = allJournalEntries.filter(
      (journal) => journal.sourceType === "purchase" || journal.movements?.some(m => m.type === "return_in")
    );
    const paymentTransactions = allJournalEntries.filter(
      (journal) => journal.sourceType === "payment"
    );
    const moneyTransferTransactions = allJournalEntries.filter(
      (journal) => journal.sourceType === "money_transfer"
    );
    const manualTransactions = allJournalEntries.filter(
      (journal) => journal.sourceType === "manual"
    );

    try {
      let blob: Blob;
      let extension: "pdf" | "xlsx";

      if (monthlyExportFormat === "excel") {
        const XLSX = await import("xlsx");
        const workbook = XLSX.utils.book_new();
        
        // 1. Summary worksheet
        const summaryWorksheet = XLSX.utils.aoa_to_sheet([
          [reportSystemName],
          [t("admin.reports.monthly.title")],
          [
            `${t("admin.reports.monthly.exportPeriod")}: ${selectedMonthRange.from} — ${selectedMonthRange.to}`,
          ],
          [`${t("admin.reports.export.preparedBy")}: ${reportPreparedBy}`],
          [
            `${t("admin.reports.export.generatedAt")}: ${new Date().toLocaleString()}`,
          ],
          [],
          headers,
          ...dataRows,
        ]);
        summaryWorksheet["!cols"] = [
          { wch: 28 },
          ...monthlyChartCurrencies.map(() => ({ wch: 16 })),
        ];
        XLSX.utils.book_append_sheet(
          workbook,
          summaryWorksheet,
          t("admin.reports.monthly.summary").slice(0, 31),
        );

        // Helper function to create transaction worksheets
        const createTransactionWorksheet = (
          transactions: JournalEntryRow[],
          title: string,
          sheetName: string
        ) => {
          if (transactions.length === 0) return;
          
          const transactionHeaders = [
            t("admin.reports.column.date"),
            t("admin.reports.column.journal"),
            t("admin.reports.column.description"),
            t("admin.reports.column.source"),
            t("admin.reports.column.status"),
            t("admin.reports.column.createdBy"),
            t("admin.reports.column.totalDebit"),
            t("admin.reports.column.totalCredit"),
          ];
          
          const transactionRows = transactions.map((journal) => {
            const totalDebit = journal.lines?.reduce((sum, line) => sum + Number(line.debit || 0), 0) || 0;
            const totalCredit = journal.lines?.reduce((sum, line) => sum + Number(line.credit || 0), 0) || 0;
            
            return [
              dateLabel(journal.entryDate),
              journal.number,
              journal.description ?? "-",
              optionLabel(journal.sourceType),
              optionLabel(journal.status),
              userLabel(journal.createdBy),
              totalDebit,
              totalCredit,
            ];
          });

          const worksheet = XLSX.utils.aoa_to_sheet([
            [reportSystemName],
            [title],
            [
              `${t("admin.reports.monthly.exportPeriod")}: ${selectedMonthRange.from} — ${selectedMonthRange.to}`,
            ],
            [`${t("admin.reports.export.preparedBy")}: ${reportPreparedBy}`],
            [`${t("admin.reports.export.count")}: ${transactions.length}`],
            [],
            transactionHeaders,
            ...transactionRows,
          ]);
          
          worksheet["!cols"] = [
            { wch: 12 }, // Date
            { wch: 16 }, // Journal Number
            { wch: 30 }, // Description
            { wch: 15 }, // Source
            { wch: 12 }, // Status
            { wch: 20 }, // Created By
            { wch: 14 }, // Total Debit
            { wch: 14 }, // Total Credit
          ];
          
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
        };

        // 2. Sales transactions worksheet
        createTransactionWorksheet(
          salesTransactions,
          "Sales Transactions",
          "Sales"
        );

        // 3. Purchase transactions worksheet
        createTransactionWorksheet(
          purchaseTransactions,
          "Purchase Transactions",
          "Purchases"
        );

        // 4. Payment transactions worksheet
        createTransactionWorksheet(
          paymentTransactions,
          "Payment Transactions",
          "Payments"
        );

        // 5. Money transfer transactions worksheet
        createTransactionWorksheet(
          moneyTransferTransactions,
          "Money Transfer Transactions",
          "Transfers"
        );

        // 6. Manual transactions worksheet
        createTransactionWorksheet(
          manualTransactions,
          "Manual Transactions",
          "Manual"
        );

        // 7. All transactions worksheet (if any)
        if (allJournalEntries.length > 0) {
          createTransactionWorksheet(
            allJournalEntries,
            "All Transactions",
            "All Transactions"
          );
        }

        blob = new Blob(
          [XLSX.write(workbook, { bookType: "xlsx", type: "array" })],
          {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        );
        extension = "xlsx";
      } else {
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([
          import("jspdf"),
          import("jspdf-autotable"),
        ]);
        const document = new jsPDF({ orientation: "landscape" });
        const fontData = await getMonthlyReportFont();
        document.addFileToVFS("NotoNaskhArabic.ttf", fontData);
        document.addFont("NotoNaskhArabic.ttf", "NotoNaskhArabic", "normal");
        document.setFont("NotoNaskhArabic", "normal");
        let y = 16;

        document.setFontSize(16);
        document.text(reportSystemName, 14, y);
        y += 8;
        document.setFontSize(10);
        document.setTextColor(90);
        document.text(t("admin.reports.monthly.title"), 14, y);
        y += 6;
        document.text(
          `${t("admin.reports.monthly.exportPeriod")}: ${selectedMonthRange.from} — ${selectedMonthRange.to}`,
          14,
          y,
        );
        y += 6;
        document.text(
          `${t("admin.reports.export.preparedBy")}: ${reportPreparedBy}  |  ${t("admin.reports.export.generatedAt")}: ${new Date().toLocaleString()}`,
          14,
          y,
        );
        document.setTextColor(0);
        
        // Summary table
        autoTable(document, {
          startY: y + 7,
          head: [headers],
          body: dataRows.map((row) => row.map(String)),
          theme: "grid",
          styles: { font: "NotoNaskhArabic", fontSize: 9, cellPadding: 3 },
          headStyles: {
            fillColor: [0, 102, 255],
            textColor: 255,
            font: "NotoNaskhArabic",
          },
          alternateRowStyles: { fillColor: [245, 248, 252] },
          columnStyles: { 0: { cellWidth: 70 } },
        });

        // Helper function to add transaction tables
        const addTransactionTable = (
          transactions: JournalEntryRow[],
          title: string
        ) => {
          if (transactions.length === 0) return;
          
          const lastTable = (document as { lastAutoTable?: { finalY: number } }).lastAutoTable;
          y = lastTable ? lastTable.finalY + 10 : y + 20;
          
          document.addPage();
          y = 16;
          document.setFontSize(14);
          document.text(title, 14, y);
          y += 8;
          
          const transactionHeaders = [
            t("admin.reports.column.date"),
            t("admin.reports.column.journal"),
            t("admin.reports.column.description"),
            t("admin.reports.column.source"),
            t("admin.reports.column.status"),
            t("admin.reports.column.totalDebit"),
            t("admin.reports.column.totalCredit"),
          ];
          
          const transactionRows = transactions.map((journal) => {
            const totalDebit = journal.lines?.reduce((sum, line) => sum + Number(line.debit || 0), 0) || 0;
            const totalCredit = journal.lines?.reduce((sum, line) => sum + Number(line.credit || 0), 0) || 0;
            
            return [
              dateLabel(journal.entryDate),
              journal.number,
              journal.description ?? "-",
              optionLabel(journal.sourceType),
              optionLabel(journal.status),
              numberLabel(totalDebit),
              numberLabel(totalCredit),
            ];
          });

          autoTable(document, {
            startY: y,
            head: [transactionHeaders],
            body: transactionRows,
            theme: "grid",
            styles: { font: "NotoNaskhArabic", fontSize: 8, cellPadding: 2 },
            headStyles: {
              fillColor: [0, 102, 255],
              textColor: 255,
              font: "NotoNaskhArabic",
            },
            alternateRowStyles: { fillColor: [245, 248, 252] },
            columnStyles: {
              0: { cellWidth: 20 }, // Date
              1: { cellWidth: 25 }, // Journal Number
              2: { cellWidth: 40 }, // Description
              3: { cellWidth: 20 }, // Source
              4: { cellWidth: 15 }, // Status
              5: { cellWidth: 20 }, // Total Debit
              6: { cellWidth: 20 }, // Total Credit
            },
          });
        };

        // Add transaction tables if there are transactions
        if (allJournalEntries.length > 0) {
          // Sales transactions
          addTransactionTable(salesTransactions, "Sales Transactions");
          
          // Purchase transactions
          addTransactionTable(purchaseTransactions, "Purchase Transactions");
          
          // Payment transactions
          addTransactionTable(paymentTransactions, "Payment Transactions");
          
          // Money transfer transactions
          addTransactionTable(moneyTransferTransactions, "Money Transfer Transactions");
          
          // Manual transactions
          addTransactionTable(manualTransactions, "Manual Transactions");
          
          // All transactions summary
          document.addPage();
          y = 16;
          document.setFontSize(14);
          document.text("Transaction Summary", 14, y);
          y += 8;
          
          const summaryHeaders = [
            "Transaction Type",
            t("admin.reports.column.count"),
            t("admin.reports.column.totalDebit"),
            t("admin.reports.column.totalCredit"),
          ];
          
          const calculateTransactionTotals = (transactions: JournalEntryRow[]) => {
            const count = transactions.length;
            const totalDebit = transactions.reduce((sum, journal) => {
              return sum + (journal.lines?.reduce((lineSum, line) => lineSum + Number(line.debit || 0), 0) || 0);
            }, 0);
            const totalCredit = transactions.reduce((sum, journal) => {
              return sum + (journal.lines?.reduce((lineSum, line) => lineSum + Number(line.credit || 0), 0) || 0);
            }, 0);
            return { count, totalDebit, totalCredit };
          };
          
          const summaryRows = [
            [
              "Sales Transactions",
              salesTransactions.length,
              numberLabel(calculateTransactionTotals(salesTransactions).totalDebit),
              numberLabel(calculateTransactionTotals(salesTransactions).totalCredit),
            ],
            [
              "Purchase Transactions",
              purchaseTransactions.length,
              numberLabel(calculateTransactionTotals(purchaseTransactions).totalDebit),
              numberLabel(calculateTransactionTotals(purchaseTransactions).totalCredit),
            ],
            [
              "Payment Transactions",
              paymentTransactions.length,
              numberLabel(calculateTransactionTotals(paymentTransactions).totalDebit),
              numberLabel(calculateTransactionTotals(paymentTransactions).totalCredit),
            ],
            [
              "Money Transfer Transactions",
              moneyTransferTransactions.length,
              numberLabel(calculateTransactionTotals(moneyTransferTransactions).totalDebit),
              numberLabel(calculateTransactionTotals(moneyTransferTransactions).totalCredit),
            ],
            [
              "Manual Transactions",
              manualTransactions.length,
              numberLabel(calculateTransactionTotals(manualTransactions).totalDebit),
              numberLabel(calculateTransactionTotals(manualTransactions).totalCredit),
            ],
            [
              "Total Transactions",
              allJournalEntries.length,
              numberLabel(calculateTransactionTotals(allJournalEntries).totalDebit),
              numberLabel(calculateTransactionTotals(allJournalEntries).totalCredit),
            ],
          ];

          autoTable(document, {
            startY: y,
            head: [summaryHeaders],
            body: summaryRows,
            theme: "grid",
            styles: { font: "NotoNaskhArabic", fontSize: 9, cellPadding: 3 },
            headStyles: {
              fillColor: [0, 102, 255],
              textColor: 255,
              font: "NotoNaskhArabic",
            },
            alternateRowStyles: { fillColor: [245, 248, 252] },
            columnStyles: {
              0: { cellWidth: 40 }, // Transaction Type
              1: { cellWidth: 20 }, // Count
              2: { cellWidth: 25 }, // Total Debit
              3: { cellWidth: 25 }, // Total Credit
            },
          });
        }

        blob = document.output("blob");
        extension = "pdf";
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      gooeyToast.success(t("admin.reports.monthly.exportSuccess"));
      setMonthlyExportFormat(null);
    } catch {
      gooeyToast.error(t("admin.reports.monthly.exportFailed"));
    } finally {
      setIsExportingMonthlyReport(false);
    }
  };
  const reportKpis = useMemo<
    Array<{
      label: string;
      value: ReactNode;
      hint?: string;
      icon: LucideIcon;
      tone?: "default" | "warning" | "success" | "neutral" | "error";
    }>
  >(() => {
    if (activeTab === "journal") {
      const journals = journalQuery.data?.items ?? [];
      const visibleDebits = visibleJournalTotals(journals, "debit");
      const visibleCredits = visibleJournalTotals(journals, "credit");
      const visibleLines = journals.reduce(
        (sum, journal) => sum + (journal.lines?.length ?? 0),
        0,
      );
      return [
        {
          label: t("admin.reports.kpi.journals"),
          value: journalQuery.data?.pagination?.total ?? journals.length,
          hint: t("admin.reports.tabs.journal"),
          icon: ReceiptText,
          tone: "neutral",
        },
        {
          label: t("admin.reports.details.totalDebit"),
          value: (
            <CurrencyTotals
              totals={visibleDebits.map((item) => ({
                currencyCode: item.currencyCode,
                total: Number(item.total),
              }))}
              kind="positive"
            />
          ),

          icon: TrendingUp,
          tone: "success",
        },
        {
          label: t("admin.reports.details.totalCredit"),
          value: <CurrencyTotals totals={visibleCredits} kind="negative" />,
          icon: TrendingDown,
          tone: "error",
        },
        {
          label: t("admin.reports.kpi.visibleLines"),
          value: visibleLines,
          hint:
            journalStatus === "all"
              ? t("admin.reports.filter.allStatuses")
              : t(`admin.reports.status.${journalStatus}` as never),
          icon: BookOpenText,
          tone: "default",
        },
      ];
    }

    if (activeTab === "monthly") {
      const monthlyTotals = monthlyQuery.data?.summary.totals ?? [];
      const monthlyNativeIncome = monthlyIncomeStatement?.nativeTotals ?? [];
      const monthlyNativePosition = monthlyBalanceSheet?.nativeTotals ?? [];
      return [
        {
          label: t("admin.reports.details.totalDebit"),
          value: (
            <CurrencyValueRows
              totals={monthlyTotals.map((item) => ({
                currencyCode: item.currencyCode,
                total: Number(item._sum?.debit ?? 0),
              }))}
            />
          ),
          icon: TrendingUp,
          tone: "success",
        },
        {
          label: t("admin.reports.details.totalCredit"),
          value: (
            <CurrencyValueRows
              totals={monthlyTotals.map((item) => ({
                currencyCode: item.currencyCode,
                total: Number(item._sum?.credit ?? 0),
              }))}
            />
          ),
          icon: TrendingDown,
          tone: "error",
        },
        {
          label: t("admin.reports.stats.profitLoss"),
          value: (
            <ProfitLossCurrencyRows
              totals={monthlyNativeIncome.map((row) => ({
                currencyCode: row.currencyCode,
                total: Number(row.net),
              }))}
            />
          ),
          icon: Scale,
          tone: "neutral",
        },
        {
          label: t("admin.reports.position.assets"),
          value: (
            <CurrencyValueRows
              totals={monthlyNativePosition.map((row) => ({
                currencyCode: row.currencyCode,
                total: Number(row.assets),
              }))}
            />
          ),
          icon: WalletCards,
          tone: "success",
        },
      ];
    }

    if (activeTab === "ledger") {
      const closing = Number(ledgerQuery.data?.summary.closingBalance ?? 0);
      const ledgerCurrency =
        ledgerQuery.data?.account?.currencyCode ?? baseCurrency;
      return [
        {
          label: t("admin.reports.ledger.opening"),
          value: (
            <BaseCurrencyValue
              value={ledgerQuery.data?.summary.openingBalance}
              currencyCode={ledgerCurrency}
            />
          ),
          icon: Landmark,
          tone: "neutral",
        },
        {
          label: t("admin.reports.details.totalDebit"),
          value: (
            <CurrencyTotals
              totals={(ledgerQuery.data?.summary?.currencyTotals ?? []).map(
                (item) => ({
                  currencyCode: item.currencyCode,
                  total: Number(item.debit),
                }),
              )}
              kind="positive"
            />
          ),
          icon: TrendingUp,
          tone: "success",
        },
        {
          label: t("admin.reports.details.totalCredit"),
          value: (
            <CurrencyTotals
              totals={(ledgerQuery.data?.summary?.currencyTotals ?? []).map(
                (item) => ({
                  currencyCode: item.currencyCode,
                  total: Number(item.credit),
                }),
              )}
              kind="negative"
            />
          ),
          icon: TrendingDown,
          tone: "error",
        },
        {
          label: t("admin.reports.ledger.closing"),
          value: (
            <BaseCurrencyValue value={closing} currencyCode={ledgerCurrency} />
          ),
          icon: Scale,
          tone: closing >= 0 ? "success" : "error",
        },
      ];
    }

    if (activeTab === "income") {
      const nativeTotals = incomeStatement?.nativeTotals ?? [];
      return [
        {
          label: t("admin.reports.summary.revenue"),
          value: (
            <CurrencyValueRows
              totals={nativeTotals.map((item) => ({
                currencyCode: item.currencyCode,
                total: Number(item.revenue),
              }))}
            />
          ),
          icon: TrendingUp,
          tone: "success",
        },
        {
          label: t("admin.reports.summary.expenses"),
          value: (
            <CurrencyValueRows
              totals={nativeTotals.map((item) => ({
                currencyCode: item.currencyCode,
                total: Number(item.expenses),
              }))}
            />
          ),
          icon: TrendingDown,
          tone: "error",
        },
        {
          label: t("admin.reports.income.net"),
          value: (
            <ProfitLossCurrencyRows
              totals={nativeTotals.map((item) => ({
                currencyCode: item.currencyCode,
                total: Number(item.net),
              }))}
            />
          ),
          icon: TrendingUp,
          tone: "neutral",
        },
        {
          label: t("admin.reports.income.totalRevenue"),
          value: incomeStatement?.revenue.length ?? 0,
          hint: t("admin.reports.income.revenue"),
          icon: ReceiptText,
          tone: "neutral",
        },
      ];
    }

    if (activeTab === "position") {
      const nativeTotals = balanceSheet?.nativeTotals ?? [];
      return [
        {
          label: t("admin.reports.position.assets"),
          value: (
            <CurrencyValueRows
              totals={nativeTotals.map((row) => ({
                currencyCode: row.currencyCode,
                total: Number(row.assets),
              }))}
            />
          ),
          icon: WalletCards,
          tone: "success",
        },
        {
          label: t("admin.reports.position.liabilities"),
          value: (
            <CurrencyValueRows
              totals={nativeTotals.map((row) => ({
                currencyCode: row.currencyCode,
                total: Number(row.liabilities),
              }))}
            />
          ),
          icon: ReceiptText,
          tone: "error",
        },
        {
          label: t("admin.reports.position.equity"),
          value: (
            <CurrencyValueRows
              totals={nativeTotals.map((row) => ({
                currencyCode: row.currencyCode,
                total: Number(row.equity),
              }))}
            />
          ),
          icon: Scale,
          tone: "neutral",
        },
        {
          label: t("admin.reports.position.currencies"),
          value: nativeTotals.length,
          icon: Landmark,
          tone: "neutral",
        },
      ];
    }

    if (activeTab === "balances") {
      return [
        {
          label: t("admin.reports.accountBalances"),
          value: accountBalances.length,
          icon: Landmark,
          tone: "neutral",
        },
        {
          label: t("admin.reports.stats.cash"),
          value: <CurrencyValueRows totals={cashCurrencyTotals} />,
          icon: WalletCards,
          tone: "neutral",
        },
        {
          label: t("admin.reports.inventoryBalances"),
          value: inventoryBalances.length,
          icon: Boxes,
          tone: "neutral",
        },
        {
          label: t("admin.reports.column.balance"),
          value: <CurrencyValueRows totals={accountBalanceCurrencyTotals} />,
          icon: Scale,
          tone: "neutral",
        },
      ];
    }

    const net = Number(financialSummary?.profitLoss.net ?? 0);
    return [
      {
        label: t("admin.reports.stats.profitLoss"),
        value: <BaseCurrencyValue value={net} currencyCode={baseCurrency} />,
        hint: t("admin.reports.currency.baseCurrency", {
          currency: baseCurrency,
        }),
        icon: net >= 0 ? TrendingUp : TrendingDown,
        tone: net >= 0 ? "success" : "error",
      },
      {
        label: t("admin.reports.stats.receivables"),
        value: <CurrencyValueRows totals={receivableCurrencyTotals} />,
        icon: BadgeDollarSign,
        tone: "success",
      },
      {
        label: t("admin.reports.stats.payables"),
        value: <CurrencyValueRows totals={payableCurrencyTotals} />,
        icon: ReceiptText,
        tone: "error",
      },
      {
        label: t("admin.reports.stats.cash"),
        value: <CurrencyValueRows totals={cashCurrencyTotals} />,
        icon: WalletCards,
        tone: "neutral",
      },
    ];
  }, [
    accountBalances,
    accountBalanceCurrencyTotals,
    activeTab,
    baseCurrency,
    balanceSheet,
    cashCurrencyTotals,
    financialSummary,
    incomeStatement,
    inventoryBalances.length,
    journalQuery.data,
    journalStatus,
    ledgerQuery.data,
    monthlyBalanceSheet,
    monthlyIncomeStatement,
    monthlyQuery.data?.summary.totals,
    payableCurrencyTotals,
    receivableCurrencyTotals,
    t,
  ]);

  // Determine which export buttons to show based on active tab
  const exportActions = activeTab === "monthly" ? (
    <ExportButtonGroup
      onExportPdf={() => setMonthlyExportFormat("pdf")}
      onExportExcel={() => setMonthlyExportFormat("excel")}
      pdfDisabled={monthlyChartData.length === 0}
      excelDisabled={monthlyChartData.length === 0}
      pdfLabel={t("admin.reports.monthly.exportPdf")}
      excelLabel={t("admin.reports.monthly.exportExcel")}
    />
  ) : activeTab === "ledger" ? (
    <ExportButtonGroup
      onExportPdf={() => void prepareLedgerExport("pdf")}
      onExportExcel={() => void prepareLedgerExport("excel")}
      pdfDisabled={!selectedLedgerAccountId || isPreparingLedgerExport}
      excelDisabled={!selectedLedgerAccountId || isPreparingLedgerExport}
      pdfLabel={t("admin.reports.monthly.exportPdf")}
      excelLabel={t("admin.reports.monthly.exportExcel")}
    />
  ) : null;

  return (
    <div className="space-y-1">
      <AdminPageHeader
        eyebrow={t("admin.reports.eyebrow")}
        title={t("admin.reports.title")}
        description={t("admin.reports.description")}
        actions={exportActions}
      />
      <div className="space-y-1">
        <div className="grid gap-1 grid-cols-2 md:grid-cols-3  xl:grid-cols-4">
          {reportKpis.map((card) => (
            <AdminKpiCard
              key={card.label}
              label={card.label}
              value={card.value}
              hint={card.hint}
              icon={card.icon}
              tone={card.tone}
            />
          ))}
        </div>
        <TableToolbar.ViewTabs
          tabs={tabs}
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ReportTab)}
        />
        {activeTab === "summary" ? (
          <div className="border border-primary-500/30 bg-primary-50 px-3 py-2 text-xs text-light-text dark:bg-dark-surface dark:text-dark-text">
            {t("admin.reports.currency.convertedNotice", {
              currency: baseCurrency,
            })}
          </div>
        ) : null}
        {activeTab === "income" ? (
          <div className="border border-primary-500/30 bg-primary-50 px-3 py-2 text-xs text-light-text dark:bg-dark-surface dark:text-dark-text">
            {t("admin.reports.monthly.nativeCurrencyNotice")}
          </div>
        ) : null}
        {activeTab === "monthly" ? (
          <div className="border border-primary-500/30 bg-primary-50 px-3 py-2 text-xs text-light-text dark:bg-dark-surface dark:text-dark-text">
            {t("admin.reports.monthly.nativeCurrencyNotice")}
          </div>
        ) : null}
        {activeTab === "position" ? (
          <div className="border border-primary-500/30 bg-primary-50 px-3 py-2 text-xs text-light-text dark:bg-dark-surface dark:text-dark-text">
            {t("admin.reports.position.nativeCurrencyNotice")}
          </div>
        ) : null}

        {activeTab === "journal" ? (
          <Table
            toolbar={
              <TableToolbar>
                <TableToolbar.Row>
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold text-light-text dark:text-dark-text">
                      {t("admin.reports.tabs.journal")}
                    </span>
                    <span className="text-xs text-light-muted dark:text-dark-muted">
                      {t("admin.reports.journal.description")}
                    </span>
                  </div>
                  <TableToolbar.IconButton
                    icon={<RefreshCcw className="size-4" />}
                    onClick={() => void journalQuery.refetch()}
                  >
                    {t("admin.reports.action.refresh")}
                  </TableToolbar.IconButton>
                </TableToolbar.Row>
                <TableToolbar.Row justify="start">
                  <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_minmax(14rem,1.15fr)_minmax(10rem,0.85fr)_minmax(12rem,1fr)_minmax(9rem,0.75fr)]">
                    <DatePickerField
                      value={fromDate}
                      onChange={(value) => {
                        setFromDate(value);
                        setJournalPage(1);
                      }}
                      tone="light"
                      containerClassName="mb-0"
                      contentClassName="z-[1500]"
                    />
                    <DatePickerField
                      value={toDate}
                      onChange={(value) => {
                        setToDate(value);
                        setJournalPage(1);
                      }}
                      tone="light"
                      containerClassName="mb-0"
                      contentClassName="z-[1500]"
                    />
                    <InputField
                      id="admin-report-journal-number"
                      value={journalNumber}
                      onChange={(event) => {
                        setJournalNumber(event.target.value);
                        setJournalPage(1);
                      }}
                      placeholder={t("admin.reports.filter.journalNumber")}
                      tone="light"
                      containerClassName="mb-0"
                      className="min-h-10"
                    />
                    <SelectField
                      value={journalStatus}
                      onValueChange={(value) => {
                        setJournalStatus(value as JournalStatus | "all");
                        setJournalPage(1);
                      }}
                      options={statusOptions}
                      tone="light"
                      clearable={false}
                      className="min-h-10 w-full"
                      contentClassName="z-[1500]"
                    />
                    <SelectField
                      value={journalSourceType}
                      onValueChange={(value) => {
                        setJournalSourceType(
                          value as JournalSourceType | "all",
                        );
                        setJournalPage(1);
                      }}
                      options={sourceOptions}
                      tone="light"
                      clearable={false}
                      className="min-h-10 w-full"
                      contentClassName="z-[1500]"
                    />
                    <SelectField
                      value={journalCurrency}
                      onValueChange={(value) => {
                        setJournalCurrency(value as CurrencyCode | "all");
                        setJournalPage(1);
                      }}
                      options={currencyOptions}
                      tone="light"
                      clearable={false}
                      className="min-h-10 w-full"
                      contentClassName="z-[1500]"
                    />
                  </div>
                </TableToolbar.Row>
              </TableToolbar>
            }
          >
            <TableHeader
              headerData={[
                {
                  title: t("admin.reports.column.journal"),
                  tooltip: t("admin.reports.columnHelp.journal"),
                },
                {
                  title: t("admin.reports.column.date"),
                  tooltip: t("admin.reports.columnHelp.date"),
                },
                {
                  title: t("admin.reports.column.description"),
                  tooltip: t("admin.reports.columnHelp.description"),
                },
                {
                  title: t("admin.reports.column.source"),
                  tooltip: t("admin.reports.columnHelp.source"),
                },
                {
                  title: t("admin.reports.column.status"),
                  tooltip: t("admin.reports.columnHelp.status"),
                },
                {
                  title: t("admin.reports.column.createdBy"),
                  tooltip: t("admin.reports.columnHelp.createdBy"),
                },
                {
                  title: t("admin.reports.column.postedBy"),
                  tooltip: t("admin.reports.columnHelp.postedBy"),
                },
              ]}
            />
            <TableBody>
              {(journalQuery.data?.items ?? []).length === 0 ? (
                <DataTableEmptyState
                  colSpan={7}
                  title={t("admin.reports.empty.journals")}
                />
              ) : (
                journalQuery.data?.items.map((journal) => (
                  <Fragment key={journal.id}>
                    <TableRow>
                      <TableColumn>{journal.number}</TableColumn>
                      <TableColumn>{dateLabel(journal.entryDate)}</TableColumn>
                      <TableColumn nowrap={false}>
                        {journal.description ?? "-"}
                      </TableColumn>
                      <TableColumn>
                        {journal.movements?.some(
                          (movement) => movement.type === "return_in",
                        ) ? (
                          <TonePill
                            label={t("admin.reports.journal.salesReturn")}
                            tone="warning"
                          />
                        ) : journal.movements?.some(
                            (movement) => movement.type === "return_out",
                          ) ? (
                          <TonePill
                            label={t("admin.reports.journal.purchaseReturn")}
                            tone="warning"
                          />
                        ) : (
                          <TonePill
                            label={optionLabel(journal.sourceType)}
                            tone="info"
                          />
                        )}
                      </TableColumn>
                      <TableColumn>
                        <TonePill
                          label={optionLabel(journal.status)}
                          tone={
                            journal.status === "posted"
                              ? "success"
                              : journal.status === "draft"
                                ? "warning"
                                : "danger"
                          }
                        />
                      </TableColumn>
                      <TableColumn>{userLabel(journal.createdBy)}</TableColumn>
                      <TableColumn>{userLabel(journal.postedBy)}</TableColumn>
                    </TableRow>
                    <TableRow>
                      <TableColumn
                        colSpan={7}
                        nowrap={false}
                        className="bg-light-bg/70 p-0 dark:bg-dark-bg/60"
                      >
                        <div className="px-4 py-3">
                          <div className="mb-2 grid grid-cols-[minmax(13rem,1.25fr)_minmax(8rem,0.8fr)_7rem_minmax(10rem,1fr)_8rem_8rem] gap-3 border-b border-light-border pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-light-muted dark:border-dark-border dark:text-dark-muted">
                            <span>{t("admin.reports.column.account")}</span>
                            <span>{t("admin.reports.column.partner")}</span>
                            <span>{t("admin.reports.column.currency")}</span>
                            <span>{t("admin.reports.column.description")}</span>
                            <span className="text-end">
                              {t("admin.reports.column.debit")}
                            </span>
                            <span className="text-end">
                              {t("admin.reports.column.credit")}
                            </span>
                          </div>
                          {(journal.lines ?? []).map((line) => (
                            <div
                              key={line.id}
                              className="grid grid-cols-1 gap-2 border-b border-light-border/70 py-2 text-xs text-light-muted last:border-b-0 dark:border-dark-border/70 dark:text-dark-muted sm:grid-cols-[minmax(13rem,1.25fr)_minmax(8rem,0.8fr)_7rem_minmax(10rem,1fr)_8rem_8rem]"
                            >
                              <span className="font-medium text-light-text dark:text-dark-text">
                                {line.account?.code ?? "-"} -{" "}
                                {line.account?.name ?? "-"}
                              </span>
                              <span>{line.partner?.name ?? "-"}</span>
                              <span>{line.currencyCode}</span>
                              <span>
                                {line.memo ?? journal.description ?? "-"}
                              </span>
                              <span className="text-end font-semibold text-green-700 dark:text-green-400">
                                {absoluteNumberLabel(line.debit)}
                              </span>
                              <span className="text-end font-semibold text-rose-700 dark:text-rose-400">
                                {absoluteNumberLabel(line.credit)}
                              </span>
                            </div>
                          ))}
                          <div className="mt-2 grid grid-cols-1 gap-2 border-t border-light-border pt-2 text-xs font-semibold dark:border-dark-border sm:grid-cols-[minmax(13rem,1.25fr)_minmax(8rem,0.8fr)_7rem_minmax(10rem,1fr)_8rem_8rem]">
                            <span className="text-light-text dark:text-dark-text">
                              {t("admin.reports.journal.total")}
                            </span>
                            <span />
                            <span />
                            <span />
                            <div className="text-end text-green-700 dark:text-green-400">
                              <CurrencyTotals
                                totals={currencyNettedTotals(
                                  journal.lines,
                                  "debit",
                                )}
                                kind="positive"
                              />
                            </div>
                            <div className="text-end text-rose-700 dark:text-rose-400">
                              <CurrencyTotals
                                totals={currencyNettedTotals(
                                  journal.lines,
                                  "credit",
                                )}
                                kind="negative"
                              />
                            </div>
                          </div>
                        </div>
                      </TableColumn>
                    </TableRow>
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        ) : null}

        {activeTab === "journal" && journalQuery.data?.pagination ? (
          <Pagination
            meta={toPaginationMeta(journalQuery.data.pagination)!}
            onPageChange={setJournalPage}
            onPageSizeChange={(nextPageSize) => {
              setJournalPageSize(nextPageSize);
              setJournalPage(1);
            }}
            disabled={journalQuery.isFetching}
          />
        ) : null}

        {activeTab === "monthly" ? (
          <div className="border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-dark-surface">
            <div className="mb-4 flex flex-col gap-3 border-b border-light-border pb-4 dark:border-dark-border lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-light-text dark:text-dark-text">
                  {t("admin.reports.monthly.title")}
                </p>
                <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">
                  {t("admin.reports.monthly.description")}
                </p>
              </div>
              <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-[24rem]">
                <SelectField
                  value={year}
                  onValueChange={setYear}
                  options={yearOptions}
                  tone="light"
                  clearable={false}
                  className="min-h-10 w-full"
                  contentClassName="z-[1500]"
                />
                <SelectField
                  value={month}
                  onValueChange={setMonth}
                  options={monthOptions}
                  tone="light"
                  clearable={false}
                  className="min-h-10 w-full"
                  contentClassName="z-[1500]"
                />
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {/* Export buttons moved to header */}
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-light-text dark:text-dark-text">
                {t("admin.reports.monthly.chartTitle")}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-light-muted dark:text-dark-muted">
                <span>{selectedMonthRange.from}</span>
                <span>-</span>
                <span>{selectedMonthRange.to}</span>
              </div>
            </div>
            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-light-muted dark:text-dark-muted">
              {monthlyChartCurrencies.map((currencyCode) => (
                <span
                  key={currencyCode}
                  className="inline-flex items-center gap-1.5"
                >
                  <span
                    className="size-2.5"
                    style={{
                      backgroundColor:
                        monthlyCurrencyColors[
                          monthlyChartCurrencies.indexOf(currencyCode) %
                            monthlyCurrencyColors.length
                        ],
                    }}
                  />
                  <CurrencyFlagIcon
                    currency={currencyCode}
                    className="h-4 w-6"
                  />
                  <span>{currencyCode}</span>
                </span>
              ))}
            </div>
            <div className="h-[24rem] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyChartData}
                  margin={{ top: 8, right: 14, left: 4, bottom: 48 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--surface-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-28}
                    textAnchor="end"
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                  />
                  <YAxis
                    tickFormatter={(value) => numberLabel(value)}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,102,255,0.06)" }}
                    content={<MonthlyChartTooltip />}
                  />
                  {monthlyChartCurrencies.map((currencyCode, index) => (
                    <Bar
                      key={currencyCode}
                      dataKey={`values.${currencyCode}`}
                      name={currencyCode}
                      fill={
                        monthlyCurrencyColors[
                          index % monthlyCurrencyColors.length
                        ]
                      }
                      radius={0}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        <FormModal
          open={monthlyExportFormat !== null}
          title={t("admin.reports.monthly.exportPreviewTitle")}
          description={t("admin.reports.monthly.exportPreviewDescription", {
            format:
              monthlyExportFormat === "pdf"
                ? t("admin.reports.monthly.exportPdf")
                : t("admin.reports.monthly.exportExcel"),
          })}
          onClose={() => setMonthlyExportFormat(null)}
          onSubmit={() => void downloadMonthlyReport()}
          submitting={isExportingMonthlyReport}
          submitLabel={
            monthlyExportFormat === "pdf"
              ? t("admin.reports.monthly.downloadPdf")
              : t("admin.reports.monthly.downloadExcel")
          }
          submittingLabel={t("admin.reports.monthly.exporting")}
          cancelLabel={t("admin.reports.action.cancel")}
          closeLabel={t("admin.reports.action.close")}
          panelClassName="max-w-4xl"
          contentClassName="block"
        >
          <div className="space-y-4 col-span-2">
            <div className="grid gap-3 border border-light-border bg-light-bg/50 p-3 text-sm dark:border-dark-border dark:bg-dark-bg/40 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-light-muted dark:text-dark-muted">
                  {t("admin.reports.monthly.exportPeriod")}
                </p>
                <p className="mt-1 font-semibold text-light-text dark:text-dark-text">
                  {selectedMonthRange.from} — {selectedMonthRange.to}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-light-muted dark:text-dark-muted">
                  {t("admin.reports.monthly.exportFormat")}
                </p>
                <p className="mt-1 font-semibold text-light-text dark:text-dark-text">
                  {monthlyExportFormat === "pdf"
                    ? t("admin.reports.monthly.exportPdf")
                    : t("admin.reports.monthly.exportExcel")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-light-muted dark:text-dark-muted">
                  {t("admin.reports.monthly.exportCurrencies")}
                </p>
                <p className="mt-1 font-semibold text-light-text dark:text-dark-text">
                  {monthlyChartCurrencies.join(", ") || "-"}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto border border-light-border dark:border-dark-border">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="bg-light-bg text-xs uppercase tracking-wide text-light-muted dark:bg-dark-bg dark:text-dark-muted">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">
                      {t("admin.reports.monthly.exportMetric")}
                    </th>
                    {monthlyChartCurrencies.map((currencyCode) => (
                      <th
                        key={currencyCode}
                        className="px-3 py-2.5 text-end font-semibold"
                      >
                        {currencyCode}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthlyExportRows.map((row) => (
                    <tr
                      key={row.metric}
                      className="border-t border-light-border dark:border-dark-border"
                    >
                      <td className="px-3 py-2 font-medium text-light-text dark:text-dark-text">
                        {row.metric}
                      </td>
                      {monthlyChartCurrencies.map((currencyCode) => (
                        <td
                          key={currencyCode}
                          className="px-3 py-2 text-end tabular-nums text-light-text dark:text-dark-text"
                        >
                          {numberLabel(row.values[currencyCode])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FormModal>

        {activeTab === "ledger" ? (
          <Table
            toolbar={
              <TableToolbar>
                <TableToolbar.Row>
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold text-light-text dark:text-dark-text">
                      {t("admin.reports.tabs.ledger")}
                    </span>
                    <span className="text-xs text-light-muted dark:text-dark-muted">
                      {ledgerQuery.data?.account
                        ? `${ledgerQuery.data.account.code} - ${ledgerQuery.data.account.name}`
                        : t("admin.reports.filter.account")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <TableToolbar.IconButton
                      icon={<RefreshCcw className="size-4" />}
                      onClick={() => void ledgerQuery.refetch()}
                    >
                      {t("admin.reports.action.refresh")}
                    </TableToolbar.IconButton>
                  </div>
                </TableToolbar.Row>
                <TableToolbar.Row justify="start">
                  <TableToolbar.Section className="grid w-full grid-cols-1 gap-2 md:grid-cols-[minmax(18rem,1fr)_minmax(12rem,14rem)_minmax(12rem,14rem)]">
                    <SelectField
                      value={selectedLedgerAccountId}
                      onValueChange={(value) => {
                        setLedgerAccountId(value);
                        setLedgerPage(1);
                      }}
                      options={accountOptions}
                      tone="light"
                      searchable
                      loading={accountsQuery.isLoading}
                      placeholder={t("admin.reports.filter.account")}
                      emptyText={t("admin.reports.empty.accounts")}
                      className="min-h-10 w-full"
                      contentClassName="z-[1500]"
                    />
                    <DatePickerField
                      value={fromDate}
                      onChange={(value) => {
                        setFromDate(value);
                        setLedgerPage(1);
                      }}
                      tone="light"
                      containerClassName="mb-0"
                      contentClassName="z-[1500]"
                    />
                    <DatePickerField
                      value={toDate}
                      onChange={(value) => {
                        setToDate(value);
                        setLedgerPage(1);
                      }}
                      tone="light"
                      containerClassName="mb-0"
                      contentClassName="z-[1500]"
                    />
                  </TableToolbar.Section>
                </TableToolbar.Row>
              </TableToolbar>
            }
          >
            <TableHeader
              headerData={[
                {
                  title: t("admin.reports.column.date"),
                  tooltip: t("admin.reports.columnHelp.date"),
                },
                {
                  title: t("admin.reports.column.journal"),
                  tooltip: t("admin.reports.columnHelp.journal"),
                },
                {
                  title: t("admin.reports.column.description"),
                  tooltip: t("admin.reports.columnHelp.description"),
                },
                {
                  title: t("admin.reports.column.partner"),
                  tooltip: t("admin.reports.columnHelp.partner"),
                },
                {
                  title: t("admin.reports.column.debit"),
                  tooltip: t("admin.reports.columnHelp.debit"),
                },
                {
                  title: t("admin.reports.column.credit"),
                  tooltip: t("admin.reports.columnHelp.credit"),
                },
                {
                  title: t("admin.reports.column.balance"),
                  tooltip: t("admin.reports.columnHelp.balance"),
                },
              ]}
            />
            <TableBody>
              <TableRow className="bg-sky-50/60 dark:bg-sky-500/5">
                <TableColumn>-</TableColumn>
                <TableColumn>-</TableColumn>
                <TableColumn nowrap={false}>
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <TonePill
                      label={t("admin.reports.ledger.opening")}
                      tone="info"
                    />
                    <span>
                      {ledgerQuery.data?.account
                        ? `${ledgerQuery.data.account.code} - ${ledgerQuery.data.account.name}`
                        : "-"}
                    </span>
                  </span>
                </TableColumn>
                <TableColumn>-</TableColumn>
                <TableColumn>0</TableColumn>
                <TableColumn>0</TableColumn>
                <TableColumn
                  className={`font-semibold ${amountToneClass(Number(ledgerQuery.data?.summary.openingBalance ?? 0))}`}
                >
                  {absoluteNumberLabel(
                    ledgerQuery.data?.summary.openingBalance,
                  )}
                </TableColumn>
              </TableRow>
              {(ledgerQuery.data?.items ?? []).length === 0 ? (
                <DataTableEmptyState
                  colSpan={7}
                  title={t("admin.reports.empty.ledger")}
                />
              ) : (
                ledgerQuery.data?.items.map((line) => (
                  <TableRow key={line.id}>
                    <TableColumn>
                      {dateLabel(line.journalEntry?.entryDate)}
                    </TableColumn>
                    <TableColumn>
                      {line.journalEntry?.number ?? "-"}
                    </TableColumn>
                    <TableColumn nowrap={false}>
                      {line.journalEntry?.description ?? line.memo ?? "-"}
                    </TableColumn>
                    <TableColumn>{line.partner?.name ?? "-"}</TableColumn>
                    <TableColumn className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {absoluteNumberLabel(line.debit)}
                    </TableColumn>
                    <TableColumn className="font-semibold text-rose-700 dark:text-rose-400">
                      {absoluteNumberLabel(line.credit)}
                    </TableColumn>
                    <TableColumn
                      className={`font-semibold ${amountToneClass(Number(line.runningBalance ?? 0))}`}
                    >
                      {absoluteNumberLabel(line.runningBalance)}
                    </TableColumn>
                  </TableRow>
                ))
              )}
              <TableRow className="bg-sky-50/60 dark:bg-sky-500/5">
                <TableColumn>-</TableColumn>
                <TableColumn>-</TableColumn>
                <TableColumn nowrap={false}>
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <TonePill
                      label={t("admin.reports.ledger.closing")}
                      tone={
                        Number(ledgerQuery.data?.summary.closingBalance ?? 0) >=
                        0
                          ? "success"
                          : "danger"
                      }
                    />
                    <span>
                      {ledgerQuery.data?.account
                        ? `${ledgerQuery.data.account.code} - ${ledgerQuery.data.account.name}`
                        : "-"}
                    </span>
                  </span>
                </TableColumn>
                <TableColumn>-</TableColumn>
                <TableColumn className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {absoluteNumberLabel(ledgerQuery.data?.summary.totalDebit)}
                </TableColumn>
                <TableColumn className="font-semibold text-rose-700 dark:text-rose-400">
                  {absoluteNumberLabel(ledgerQuery.data?.summary.totalCredit)}
                </TableColumn>
                <TableColumn
                  className={`font-semibold ${amountToneClass(Number(ledgerQuery.data?.summary.closingBalance ?? 0))}`}
                >
                  {absoluteNumberLabel(
                    ledgerQuery.data?.summary.closingBalance,
                  )}
                </TableColumn>
              </TableRow>
            </TableBody>
          </Table>
        ) : null}

        {activeTab === "ledger" && ledgerQuery.data?.pagination ? (
          <Pagination
            meta={toPaginationMeta(ledgerQuery.data.pagination)!}
            onPageChange={setLedgerPage}
            onPageSizeChange={(nextPageSize) => {
              setLedgerPageSize(nextPageSize);
              setLedgerPage(1);
            }}
            disabled={ledgerQuery.isFetching}
          />
        ) : null}

        <FormModal
          open={ledgerExportFormat !== null}
          title={t("admin.reports.ledger.exportPreviewTitle")}
          description={t("admin.reports.ledger.exportPreviewDescription", {
            count: ledgerExportData?.items.length ?? 0,
          })}
          onClose={() => setLedgerExportFormat(null)}
          onSubmit={() => void downloadLedgerReport()}
          submitting={isExportingLedgerReport}
          submitLabel={
            ledgerExportFormat === "pdf"
              ? t("admin.reports.monthly.downloadPdf")
              : t("admin.reports.monthly.downloadExcel")
          }
          submittingLabel={t("admin.reports.monthly.exporting")}
          cancelLabel={t("admin.reports.action.cancel")}
          closeLabel={t("admin.reports.action.close")}
          panelClassName="max-w-6xl"
          contentClassName="block"
        >
          <div className="space-y-4 col-span-2">
            <div className="grid gap-3 border border-light-border bg-light-bg/50 p-3 text-sm dark:border-dark-border dark:bg-dark-bg/40 sm:grid-cols-3">
              <div>
                <p className="text-xs text-light-muted dark:text-dark-muted">
                  {t("admin.reports.filter.account")}
                </p>
                <p className="font-semibold">
                  {ledgerExportData?.account
                    ? `${ledgerExportData.account.code} - ${ledgerExportData.account.name}`
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-light-muted dark:text-dark-muted">
                  {t("admin.reports.export.filters")}
                </p>
                <p className="font-semibold">
                  {fromDate} — {toDate}
                </p>
              </div>
              <div>
                <p className="text-xs text-light-muted dark:text-dark-muted">
                  {t("admin.reports.export.preparedBy")}
                </p>
                <p className="font-semibold">{reportPreparedBy}</p>
              </div>
            </div>
            {ledgerExportGroups.map(([currency, lines]) => (
              <div
                key={currency}
                className="overflow-x-auto border border-light-border dark:border-dark-border"
              >
                <p className="border-b border-light-border bg-light-bg px-3 py-2 text-sm font-semibold dark:border-dark-border dark:bg-dark-bg">
                  {currency}
                </p>
                <table className="w-full min-w-[56rem] text-left text-xs">
                  <thead className="bg-light-bg/60 text-light-muted dark:bg-dark-bg/60 dark:text-dark-muted">
                    <tr>
                      {[
                        t("admin.reports.column.date"),
                        t("admin.reports.column.journal"),
                        t("admin.reports.column.description"),
                        t("admin.reports.column.partner"),
                        t("admin.reports.column.debit"),
                        t("admin.reports.column.credit"),
                        t("admin.reports.column.balance"),
                      ].map((label) => (
                        <th key={label} className="px-3 py-2 font-semibold">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr
                        key={line.id}
                        className="border-t border-light-border dark:border-dark-border"
                      >
                        <td className="px-3 py-2">
                          {dateLabel(line.journalEntry?.entryDate)}
                        </td>
                        <td className="px-3 py-2">
                          {line.journalEntry?.number ?? "-"}
                        </td>
                        <td className="px-3 py-2">
                          {line.journalEntry?.description ?? line.memo ?? "-"}
                        </td>
                        <td className="px-3 py-2">
                          {line.partner?.name ?? "-"}
                        </td>
                        <td className="px-3 py-2 text-end">
                          {numberLabel(line.debit)}
                        </td>
                        <td className="px-3 py-2 text-end">
                          {numberLabel(line.credit)}
                        </td>
                        <td className="px-3 py-2 text-end">
                          {numberLabel(line.runningBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </FormModal>

        {activeTab === "income" ? (
          <div className="space-y-2">
            <div className="border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-dark-surface">
              <div className="grid gap-3 sm:grid-cols-3">
                <AdminKpiCard
                  label={t("admin.reports.summary.revenue")}
                  value={
                    <CurrencyValueRows
                      totals={(incomeStatement?.nativeTotals ?? []).map(
                        (item) => ({
                          currencyCode: item.currencyCode,
                          total: Number(item.revenue),
                        }),
                      )}
                    />
                  }
                  icon={TrendingUp}
                  tone="success"
                />
                <AdminKpiCard
                  label={t("admin.reports.summary.expenses")}
                  value={
                    <CurrencyValueRows
                      totals={(incomeStatement?.nativeTotals ?? []).map(
                        (item) => ({
                          currencyCode: item.currencyCode,
                          total: Number(item.expenses),
                        }),
                      )}
                    />
                  }
                  icon={TrendingDown}
                  tone="error"
                />
                <AdminKpiCard
                  label={t("admin.reports.income.net")}
                  value={
                    <ProfitLossCurrencyRows
                      totals={(incomeStatement?.nativeTotals ?? []).map(
                        (item) => ({
                          currencyCode: item.currencyCode,
                          total: Number(item.net),
                        }),
                      )}
                    />
                  }
                  icon={TrendingUp}
                  tone="neutral"
                />
              </div>
            </div>
            <div className="mb-4 grid grid-cols-2  gap-2">
              <DatePickerField
                value={fromDate}
                onChange={setFromDate}
                tone="light"
                containerClassName="mb-0 min-w-48"
                contentClassName="z-[1500]"
              />
              <DatePickerField
                value={toDate}
                onChange={setToDate}
                tone="light"
                containerClassName="mb-0 min-w-48"
                contentClassName="z-[1500]"
              />
            </div>
            <CombinedStatementTable
              title={t("admin.reports.tabs.income")}
              rows={incomeRows}
              emptyTitle={t("admin.reports.empty.revenue")}
              onOpenLedger={(accountId) => {
                setLedgerAccountId(accountId);
                setLedgerPage(1);
                setActiveTab("ledger");
              }}
            />
          </div>
        ) : null}

        {activeTab === "position" ? (
          <div className="space-y-2">
            <div className="border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-dark-surface">
              <div className="mb-4">
                <DatePickerField
                  value={toDate}
                  onChange={setToDate}
                  tone="light"
                  containerClassName="mb-0"
                  contentClassName="z-[1500]"
                />
              </div>
              <p className="text-xs text-light-muted dark:text-dark-muted">
                {t("admin.reports.position.equationHelp")}
              </p>
            </div>
            <Table className="!w-full !min-w-[760px] !table-fixed">
              <TableHeader
                headerData={[
                  {
                    title: t("admin.reports.column.currency"),
                    tooltip: t("admin.reports.columnHelp.currency"),
                    align: "end" as const,
                    width: "14%",
                  },
                  {
                    title: (
                      <AccountingTerm
                        label={t("admin.reports.position.assetsPlain")}
                        help={t("admin.reports.position.assetsHelp")}
                      />
                    ),
                    align: "center" as const,
                    width: "17%",
                  },
                  {
                    title: (
                      <AccountingTerm
                        label={t("admin.reports.position.liabilitiesPlain")}
                        help={t("admin.reports.position.liabilitiesHelp")}
                      />
                    ),
                    align: "center" as const,
                    width: "17%",
                  },
                  {
                    title: (
                      <AccountingTerm
                        label={t("admin.reports.position.equityPlain")}
                        help={t("admin.reports.position.equityHelp")}
                      />
                    ),
                    align: "center" as const,
                    width: "17%",
                  },
                  {
                    title: (
                      <AccountingTerm
                        label={t(
                          "admin.reports.position.crossCurrencyPosition",
                        )}
                        help={t("admin.reports.position.adjustmentHelp")}
                      />
                    ),
                    align: "center" as const,
                    width: "20%",
                  },
                  {
                    title: t("admin.reports.column.status"),
                    tooltip: t("admin.reports.columnHelp.positionStatus"),
                    align: "center" as const,
                    width: "15%",
                  },
                ]}
              />
              <TableBody>
                {(balanceSheet?.nativeTotals ?? []).map((row) => (
                  <TableRow key={row.currencyCode}>
                    <TableColumn className="">
                      <span className="inline-flex items-center justify-center gap-2">
                        <CurrencyFlagIcon
                          currency={row.currencyCode}
                          className="h-4 w-6"
                        />
                        <span>{row.currencyCode}</span>
                      </span>
                    </TableColumn>
                    <TableColumn className=" font-semibold text-emerald-700 dark:text-emerald-400">
                      {absoluteNumberLabel(row.assets)}
                    </TableColumn>
                    <TableColumn className=" font-semibold text-rose-700 dark:text-rose-400">
                      {absoluteNumberLabel(row.liabilities)}
                    </TableColumn>
                    <TableColumn className="text-center font-semibold text-sky-700 dark:text-sky-400">
                      <span className="inline-flex flex-col items-center gap-0.5">
                        <span>{absoluteNumberLabel(row.equity)}</span>
                        {Number(row.equity) < 0 ? (
                          <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400">
                            {t("admin.reports.position.deficit")}
                          </span>
                        ) : null}
                      </span>
                    </TableColumn>
                    <TableColumn className="text-center font-semibold text-amber-700 dark:text-amber-400">
                      <span className="inline-flex flex-col items-center gap-0.5">
                        <span>
                          {absoluteNumberLabel(row.crossCurrencyPosition)}
                        </span>
                        {Number(row.crossCurrencyPosition) > 0 ? (
                          <span className="text-[10px] font-medium">
                            {t("admin.reports.position.fundedByOtherCurrency")}
                          </span>
                        ) : Number(row.crossCurrencyPosition) < 0 ? (
                          <span className="text-[10px] font-medium">
                            {t("admin.reports.position.fundsOtherCurrency")}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-light-muted dark:text-dark-muted">
                            {t("admin.reports.position.noAdjustment")}
                          </span>
                        )}
                      </span>
                    </TableColumn>
                    <TableColumn className="">
                      <TonePill
                        label={t(
                          row.balanced
                            ? "admin.reports.position.nativeBalanced"
                            : "admin.reports.position.crossCurrencyActivity",
                        )}
                        tone={row.balanced ? "success" : "warning"}
                      />
                    </TableColumn>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}

        {activeTab === "summary" ? (
          <div className="">
            <div className="mb-4 grid mt-1 sm:grid-cols-2 gap-2">
              <DatePickerField
                value={fromDate}
                onChange={setFromDate}
                tone="light"
                containerClassName="mb-0 min-w-48"
              />
              <DatePickerField
                value={toDate}
                onChange={setToDate}
                tone="light"
                containerClassName="mb-0 min-w-48"
              />
            </div>
            <div className="grid gap-4">
              <SummaryExposureTable
                title={t("admin.reports.summary.receivables")}
                rows={financialSummary?.receivables.rows ?? []}
                emptyTitle={t("admin.reports.empty.receivables")}
                tone="incoming"
              />
              <SummaryExposureTable
                title={t("admin.reports.summary.payables")}
                rows={financialSummary?.payables.rows ?? []}
                emptyTitle={t("admin.reports.empty.payables")}
                tone="outgoing"
              />
            </div>
          </div>
        ) : null}

        {activeTab === "balances" ? (
          <div className="grid gap-4">
            <Table
              toolbar={
                <TableToolbar>
                  <TableToolbar.Row>
                    <span className="text-sm font-semibold">
                      {t("admin.reports.accountBalances")}
                    </span>
                  </TableToolbar.Row>
                </TableToolbar>
              }
            >
              <TableHeader
                headerData={[
                  {
                    title: t("admin.reports.column.account"),
                    tooltip: t("admin.reports.columnHelp.account"),
                  },
                  {
                    title: t("admin.reports.column.currency"),
                    tooltip: t("admin.reports.columnHelp.currency"),
                  },
                  {
                    title: t("admin.reports.column.balance"),
                    tooltip: t("admin.reports.columnHelp.balance"),
                  },
                ]}
              />
              <TableBody>
                {accountBalances.length === 0 ? (
                  <DataTableEmptyState
                    colSpan={3}
                    title={t("admin.reports.empty.balances")}
                  />
                ) : (
                  accountBalances.slice(0, 8).map((row, index) => (
                    <TableRow
                      key={`${row.account?.id}-${row.currencyCode}-${index}`}
                    >
                      <TableColumn>
                        <span className="inline-flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {row.account?.name ?? "-"}
                          </span>
                          {row.account?.category ? (
                            <TooltipComponent
                              content={t(
                                `admin.accounts.categoryHelp.${row.account.category}` as never,
                              )}
                            >
                              <span
                                tabIndex={0}
                                className="cursor-help outline-none"
                              >
                                <TonePill
                                  label={t(
                                    `admin.accounts.category.${row.account.category}` as never,
                                  )}
                                  tone={
                                    row.account.category === "asset"
                                      ? "success"
                                      : row.account.category === "liability"
                                        ? "danger"
                                        : "info"
                                  }
                                />
                              </span>
                            </TooltipComponent>
                          ) : null}
                        </span>
                      </TableColumn>
                      <TableColumn>{row.currencyCode}</TableColumn>
                      <TableColumn
                        className={` font-semibold ${row.account?.category === "asset" ? "text-emerald-700 dark:text-emerald-400" : row.account?.category === "liability" ? "text-rose-700 dark:text-rose-400" : "text-sky-700 dark:text-sky-400"}`}
                      >
                        {absoluteNumberLabel(row.balance)}
                      </TableColumn>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Table
              toolbar={
                <TableToolbar>
                  <TableToolbar.Row>
                    <span className="text-sm font-semibold">
                      {t("admin.reports.inventoryBalances")}
                    </span>
                  </TableToolbar.Row>
                </TableToolbar>
              }
            >
              <TableHeader
                headerData={[
                  {
                    title: t("admin.reports.column.product"),
                    tooltip: t("admin.reports.columnHelp.product"),
                  },
                  {
                    title: t("admin.reports.column.location"),
                    tooltip: t("admin.reports.columnHelp.location"),
                  },
                  {
                    title: t("admin.reports.column.quantity"),
                    tooltip: t("admin.reports.columnHelp.quantity"),
                    align: "end" as const,
                  },
                ]}
              />
              <TableBody>
                {inventoryBalances.length === 0 ? (
                  <DataTableEmptyState
                    colSpan={3}
                    title={t("admin.reports.empty.inventory")}
                  />
                ) : (
                  inventoryBalances.slice(0, 8).map((row, index) => (
                    <TableRow
                      key={`${row.product?.id}-${row.location?.id}-${index}`}
                    >
                      <TableColumn>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">
                            {row.product?.name ?? "-"}
                          </span>
                          <span className="text-xs text-light-muted dark:text-dark-muted">
                            {row.product?.sku ?? "-"}
                          </span>
                        </div>
                      </TableColumn>
                      <TableColumn>{row.location?.name ?? "-"}</TableColumn>
                      <TableColumn
                        className={`font-semibold ${Number(row.quantityOnHand ?? 0) > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
                      >
                        {absoluteNumberLabel(row.quantityOnHand)}
                      </TableColumn>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </div>
    </div>
  );
}

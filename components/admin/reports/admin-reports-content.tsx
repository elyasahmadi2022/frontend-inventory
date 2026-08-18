"use client";

import {
  AdminPageHeader,
  ExportButtonGroup,
} from "@/components/admin/admin-page-header";
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
import {
  formatAppLongDate,
  getLocalDateString,
  toIsoDate,
} from "@/lib/date-format";
import { useI18n } from "@/lib/i18n";
import { getStoredCalendarType } from "@/lib/user-preferences";
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
import {
  fetchAccountLedger,
  fetchJournalReport,
} from "@/services/reports-admin.service";
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
  if (!Number.isFinite(parsed)) return "0";
  const rounded = Math.round((parsed + Number.EPSILON) * 100) / 100;
  return rounded.toLocaleString(undefined, { maximumFractionDigits: 2 });
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

const CASH_ACCOUNT_TYPES = new Set(["cash", "bank", "sarafi", "daskhil"]);

function filterCurrencyTotals(
  totals: Array<{ currencyCode: string; total: number }>,
  currency: CurrencyCode | "all",
) {
  if (currency === "all") return totals;
  const match = totals.find((item) => item.currencyCode === currency);
  return match ? [match] : [{ currencyCode: currency, total: 0 }];
}

function FilteredCurrencyValue({
  totals,
  currency,
}: {
  totals: Array<{ currencyCode: string; total: number }>;
  currency: CurrencyCode | "all";
}) {
  const filtered = filterCurrencyTotals(totals, currency);
  if (currency !== "all" && filtered.length === 1) {
    return (
      <BaseCurrencyValue
        value={filtered[0].total}
        currencyCode={filtered[0].currencyCode}
      />
    );
  }
  return <CurrencyValueRows totals={filtered} />;
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
  const { language, t } = useI18n();
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
  const [monthlyCurrency, setMonthlyCurrency] = useState<CurrencyCode | "all">(
    "all",
  );
  const [monthlyExportFormat, setMonthlyExportFormat] = useState<
    "pdf" | "csv" | null
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
  const monthlyCashCurrencyTotals = useMemo(
    () =>
      groupedAmounts(
        (monthlyBalanceSheet?.assets ?? [])
          .filter((row) => CASH_ACCOUNT_TYPES.has(row.account.type))
          .map((row) => ({
            currencyCode: row.currencyCode ?? baseCurrency,
            amount: row.balance,
          })),
      ),
    [baseCurrency, monthlyBalanceSheet],
  );
  const monthlyReceivableCurrencyTotals = useMemo(
    () =>
      groupedAmounts(
        (monthlyFinancialSummary?.receivables.rows ?? []).map((row) => ({
          currencyCode: row.currencyCode,
          amount: row.balance,
        })),
      ),
    [monthlyFinancialSummary],
  );
  const monthlyPayableCurrencyTotals = useMemo(
    () =>
      groupedAmounts(
        (monthlyFinancialSummary?.payables.rows ?? []).map((row) => ({
          currencyCode: row.currencyCode,
          amount: row.balance,
        })),
      ),
    [monthlyFinancialSummary],
  );
  const monthlyAssetCurrencyTotals = useMemo(
    () =>
      (monthlyBalanceSheet?.nativeTotals ?? []).map((row) => ({
        currencyCode: row.currencyCode,
        total: Number(row.assets),
      })),
    [monthlyBalanceSheet],
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
  const monthlyAvailableCurrencies = useMemo(
    () => [
      ...new Set(
        monthlyChartData.flatMap((entry) =>
          entry.nativeValues.map((item) => item.currencyCode),
        ),
      ),
    ],
    [monthlyChartData],
  );
  const monthlyChartCurrencies = useMemo(
    () =>
      monthlyCurrency === "all"
        ? monthlyAvailableCurrencies
        : monthlyAvailableCurrencies.filter(
            (currencyCode) => currencyCode === monthlyCurrency,
          ),
    [monthlyAvailableCurrencies, monthlyCurrency],
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
    const reportDate = (value: string) =>
      formatAppLongDate(value, getStoredCalendarType(), language);
    const reportPeriod = `${reportDate(selectedMonthRange.from)} — ${reportDate(selectedMonthRange.to)}`;
    const overviewHeaders = [
      t("admin.reports.monthly.exportMetric"),
      ...monthlyChartCurrencies,
    ];
    const overviewRows = monthlyExportRows.map((row) => [
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

    // Keep every posted transaction and its native-currency journal lines. This
    // avoids combining AFN, USD, and PKR into misleading grand totals.
    const salesTransactions = allJournalEntries.filter(
      (journal) =>
        journal.sourceType === "sale" ||
        journal.movements?.some((m) => m.type === "return_out"),
    );
    const purchaseTransactions = allJournalEntries.filter(
      (journal) =>
        journal.sourceType === "purchase" ||
        journal.movements?.some((m) => m.type === "return_in"),
    );
    const paidTransactions = allJournalEntries.filter(
      (journal) => journal.sourceType === "payment",
    );

    const transactionHeaders = [
      t("admin.reports.column.date"),
      t("admin.reports.column.description"),
      t("admin.reports.column.account"),
      t("admin.reports.column.partner"),
      t("admin.reports.column.currency"),
      t("admin.reports.column.debit"),
      t("admin.reports.column.credit"),
    ];
    const transactionRows = (transactions: JournalEntryRow[]) => {
      const rows = transactions.flatMap((journal) =>
        (journal.lines ?? []).map((line) => [
          reportDate(journal.entryDate),
          journal.description ?? "-",
          line.account ? `${line.account.code} - ${line.account.name}` : "-",
          line.partner?.name ?? "-",
          line.currencyCode ?? "-",
          Number(line.debit ?? 0),
          Number(line.credit ?? 0),
        ]),
      );
      const totals = new Map<string, { debit: number; credit: number }>();
      rows.forEach((row) => {
        const currency = String(row[4]);
        const total = totals.get(currency) ?? { debit: 0, credit: 0 };
        total.debit += Number(row[5]);
        total.credit += Number(row[6]);
        totals.set(currency, total);
      });
      return [
        ...rows,
        ...[...totals.entries()].map(([currency, total]) => [
          "",
          t("admin.reports.journal.total"),
          "",
          "",
          currency,
          total.debit,
          total.credit,
        ]),
      ];
    };
    const incomeHeaders = [
      t("admin.reports.column.account"),
      t("admin.reports.column.type"),
      t("admin.reports.column.currency"),
      t("admin.reports.column.totalAmount"),
    ];
    const incomeRows = [
      ...(monthlyIncomeStatement?.revenue ?? []).map((row) => [
        `${row.account.code} - ${row.account.name}`,
        t("admin.reports.income.revenue"),
        row.currencyCode ?? baseCurrency,
        Math.abs(Number(row.balance ?? 0)),
      ]),
      ...(monthlyIncomeStatement?.expenses ?? []).map((row) => [
        `${row.account.code} - ${row.account.name}`,
        t("admin.reports.income.expenses"),
        row.currencyCode ?? baseCurrency,
        Math.abs(Number(row.balance ?? 0)),
      ]),
    ];
    const partnerHeaders = [
      t("admin.reports.column.partner"),
      t("admin.partners.column.type"),
      t("admin.reports.column.currency"),
      t("admin.partners.details.settledAmount"),
      t("admin.partners.details.outstandingAmount"),
    ];
    const partnerTypeLabel = (type?: string | null) => {
      if (type === "customer") return t("admin.partners.type.customer");
      if (type === "vendor") return t("admin.partners.type.vendor");
      if (type === "both") return t("admin.partners.type.both");
      if (type === "sarafi") return t("admin.partners.type.sarafi");
      if (type === "staff") return t("admin.partners.type.staff");
      return "-";
    };
    const partnerRows = (rows: PartnerBalanceRow[]) =>
      rows.map((row) => [
        row.partner?.name ?? "-",
        partnerTypeLabel(row.partner?.type),
        row.currencyCode,
        Number(row.debitTotal ?? 0) - Number(row.creditTotal ?? 0),
        Math.abs(Number(row.balance ?? 0)),
      ]);
    type ExportRow = Array<string | number>;
    const sections: Array<{
      title: string;
      headers: string[];
      rows: ExportRow[];
    }> = [
      {
        title: t("admin.reports.monthly.summary"),
        headers: overviewHeaders,
        rows: overviewRows,
      },
      {
        title: t("admin.reports.tabs.income"),
        headers: incomeHeaders,
        rows: incomeRows,
      },
      {
        title: t("admin.reports.monthly.sales"),
        headers: transactionHeaders,
        rows: transactionRows(salesTransactions),
      },
      {
        title: t("admin.reports.monthly.purchases"),
        headers: transactionHeaders,
        rows: transactionRows(purchaseTransactions),
      },
      {
        title: t("admin.operations.stats.paid"),
        headers: transactionHeaders,
        rows: transactionRows(paidTransactions),
      },
      {
        title: t("admin.reports.summary.receivables"),
        headers: partnerHeaders,
        rows: partnerRows(monthlyFinancialSummary?.receivables.rows ?? []),
      },
      {
        title: t("admin.reports.summary.payables"),
        headers: partnerHeaders,
        rows: partnerRows(monthlyFinancialSummary?.payables.rows ?? []),
      },
    ];

    try {
      let blob: Blob;
      let extension: "pdf" | "csv";

      if (monthlyExportFormat === "csv") {
        const escapeCsv = (value: string | number) =>
          `"${(typeof value === "number" ? numberLabel(value) : value).replaceAll('"', '""')}"`;
        const csvRows: ExportRow[] = [
          [reportSystemName],
          [t("admin.reports.monthly.title")],
          [`${t("admin.reports.monthly.exportPeriod")}: ${reportPeriod}`],
          [`${t("admin.reports.export.preparedBy")}: ${reportPreparedBy}`],
          [],
          ...sections.flatMap((section) => [
            [section.title],
            section.headers,
            ...section.rows,
            [],
          ]),
        ];
        blob = new Blob(
          [
            `\uFEFF${csvRows.map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`,
          ],
          {
            type: "text/csv;charset=utf-8",
          },
        );
        extension = "csv";
      } else {
        // Render with the browser's locale font before adding it to the PDF.
        // jsPDF's text encoder cannot reliably shape Persian/Pashto glyphs.
        const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
          import("jspdf"),
          import("html2canvas"),
        ]);
        const document = new jsPDF({ orientation: "landscape" });
        const makePage = () => {
          const page = window.document.createElement("div");
          page.dir = window.document.documentElement.dir;
          page.style.cssText =
            "position:fixed;left:-10000px;top:0;width:1120px;padding:38px;background:#fff;color:#182230;font:15px var(--font-locale),sans-serif;";
          return page;
        };
        const addPdfPage = async (page: HTMLDivElement, first = false) => {
          window.document.body.appendChild(page);
          const canvas = await html2canvas(page, {
            backgroundColor: "#ffffff",
            scale: 2,
          });
          page.remove();
          if (!first) document.addPage();
          document.addImage(
            canvas.toDataURL("image/png"),
            "PNG",
            12,
            10,
            273,
            (canvas.height / canvas.width) * 273,
          );
        };
        const money = (value: string | number) => numberLabel(value);
        const currencySummary = (
          totals: Array<{ currencyCode: string; total: number }>,
        ) =>
          totals.length
            ? totals
                .map((item) => `${money(item.total)} ${item.currencyCode}`)
                .join("<br>")
            : "0";
        const firstPage = makePage();
        firstPage.innerHTML = `<div style="border-bottom:3px solid #0066ff;padding-bottom:18px;text-align:center"><div style="font-size:27px;font-weight:800">${reportSystemName}</div><div style="font-size:21px;font-weight:700;margin-top:4px">${t("admin.reports.monthly.title")}</div><div style="color:#475569;margin-top:8px">${t("admin.reports.monthly.exportPeriod")}: ${reportPeriod}</div><div style="color:#64748b;font-size:13px;margin-top:6px">${t("admin.reports.export.preparedBy")}: ${reportPreparedBy}</div></div>`;
        const dashboard = window.document.createElement("div");
        dashboard.style.cssText =
          "display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:24px;text-align:center;";
        const addColumn = (
          title: string,
          color: string,
          entries: Array<[string, string, string]>,
        ) => {
          const column = window.document.createElement("section");
          column.style.cssText = `border:1px solid #cbd5e1;border-top:5px solid ${color};padding:18px;`;
          const heading = window.document.createElement("h2");
          heading.textContent = title;
          heading.style.cssText = "margin:0 0 14px;font-size:18px;";
          column.appendChild(heading);
          entries.forEach(([label, value, cardColor]) => {
            const card = window.document.createElement("div");
            card.style.cssText = `background:${cardColor}12;border:1px solid ${cardColor}55;padding:11px;margin-top:8px;`;
            card.innerHTML = `<div style="font-size:13px;color:#475569">${label}</div><div style="font-size:18px;font-weight:800;margin-top:4px">${value}</div>`;
            column.appendChild(card);
          });
          dashboard.appendChild(column);
        };
        addColumn(t("admin.reports.tabs.income"), "#047857", [
          [
            t("admin.reports.summary.revenue"),
            currencySummary(
              (monthlyIncomeStatement?.nativeTotals ?? []).map((row) => ({
                currencyCode: row.currencyCode,
                total: Number(row.revenue),
              })),
            ),
            "#059669",
          ],
          [
            t("admin.reports.summary.expenses"),
            currencySummary(
              (monthlyIncomeStatement?.nativeTotals ?? []).map((row) => ({
                currencyCode: row.currencyCode,
                total: Number(row.expenses),
              })),
            ),
            "#dc2626",
          ],
          [
            t("admin.reports.stats.profitLoss"),
            currencySummary(
              (monthlyIncomeStatement?.nativeTotals ?? []).map((row) => ({
                currencyCode: row.currencyCode,
                total: Number(row.net),
              })),
            ),
            "#d97706",
          ],
        ]);
        addColumn(t("admin.reports.tabs.summary"), "#2563eb", [
          [
            t("admin.reports.monthly.sales"),
            String(salesTransactions.length),
            "#059669",
          ],
          [
            t("admin.reports.monthly.purchases"),
            String(purchaseTransactions.length),
            "#7c3aed",
          ],
          [
            t("admin.operations.stats.paid"),
            String(paidTransactions.length),
            "#dc2626",
          ],
          [
            t("admin.reports.summary.receivables"),
            currencySummary(monthlyReceivableCurrencyTotals),
            "#2563eb",
          ],
          [
            t("admin.reports.summary.payables"),
            currencySummary(monthlyPayableCurrencyTotals),
            "#d97706",
          ],
        ]);
        firstPage.appendChild(dashboard);
        await addPdfPage(firstPage, true);

        const addSectionTable = (
          page: HTMLDivElement,
          section: (typeof sections)[number],
          rows: ExportRow[],
        ) => {
          const title = window.document.createElement("h2");
          title.textContent = section.title;
          title.style.cssText =
            "margin:0 0 12px;padding-top:8px;text-align:center;font-size:20px;";
          page.appendChild(title);
          const table = window.document.createElement("table");
          table.style.cssText =
            "width:100%;border-collapse:collapse;text-align:center;font-size:12px;";
          const header = table.insertRow();
          section.headers.forEach((label) => {
            const cell = window.document.createElement("th");
            cell.textContent = label;
            cell.style.cssText =
              "border:1px solid #bfdbfe;background:#0066ff;color:#fff;padding:8px;text-align:center;";
            header.appendChild(cell);
          });
          rows.forEach((row) => {
            const tr = table.insertRow();
            row.forEach((value, index) => {
              const cell = tr.insertCell();
              cell.textContent =
                typeof value === "number" ? money(value) : value;
              const isDebit =
                section.headers[index] === t("admin.reports.column.debit");
              const isCredit =
                section.headers[index] === t("admin.reports.column.credit");
              cell.style.cssText = `border:1px solid #cbd5e1;padding:7px;text-align:center;${isDebit ? "color:#047857;background:#ecfdf5;font-weight:700;" : isCredit ? "color:#dc2626;background:#fef2f2;font-weight:700;" : ""}`;
            });
          });
          page.appendChild(table);
        };
        const sectionGroups = [
          [sections[0]],
          [sections[1], sections[2]],
          [sections[3]],
          [sections[4], sections[5], sections[6]],
        ];
        for (const group of sectionGroups) {
          const page = makePage();
          const rowLimit = group.length > 1 ? 10 : 24;
          group.forEach((section) => {
            const rows = section.rows.length ? section.rows : [["-"]];
            addSectionTable(page, section, rows.slice(0, rowLimit));
          });
          await addPdfPage(page);
          for (const section of group) {
            const rows = section.rows.length ? section.rows : [["-"]];
            for (let start = rowLimit; start < rows.length; start += 24) {
              const continuation = makePage();
              addSectionTable(
                continuation,
                section,
                rows.slice(start, start + 24),
              );
              await addPdfPage(continuation);
            }
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
    // if (activeTab === "journal") {
    //   const journals = journalQuery.data?.items ?? [];
    //   const visibleDebits = visibleJournalTotals(journals, "debit");
    //   const visibleCredits = visibleJournalTotals(journals, "credit");
    //   const visibleLines = journals.reduce(
    //     (sum, journal) => sum + (journal.lines?.length ?? 0),
    //     0,
    //   );
    //   return [
    //     {
    //       label: t("admin.reports.kpi.journals"),
    //       value: journalQuery.data?.pagination?.total ?? journals.length,
    //       hint: t("admin.reports.tabs.journal"),
    //       icon: ReceiptText,
    //       tone: "neutral",
    //     },
    //     {
    //       label: t("admin.reports.details.totalDebit"),
    //       value: (
    //         <CurrencyTotals
    //           totals={visibleDebits.map((item) => ({
    //             currencyCode: item.currencyCode,
    //             total: Number(item.total),
    //           }))}
    //           kind="positive"
    //         />
    //       ),

    //       icon: TrendingUp,
    //       tone: "success",
    //     },
    //     {
    //       label: t("admin.reports.details.totalCredit"),
    //       value: <CurrencyTotals totals={visibleCredits} kind="negative" />,
    //       icon: TrendingDown,
    //       tone: "error",
    //     },
    //     {
    //       label: t("admin.reports.kpi.visibleLines"),
    //       value: visibleLines,
    //       hint:
    //         journalStatus === "all"
    //           ? t("admin.reports.filter.allStatuses")
    //           : t(`admin.reports.status.${journalStatus}` as never),
    //       icon: BookOpenText,
    //       tone: "default",
    //     },
    //   ];
    // }

    if (activeTab === "monthly") {
      return [
        {
          label: t("admin.reports.stats.cash"),
          value: (
            <FilteredCurrencyValue
              totals={monthlyCashCurrencyTotals}
              currency={monthlyCurrency}
            />
          ),
          icon: WalletCards,
          tone: "neutral",
        },
        {
          label: t("admin.reports.stats.payables"),
          value: (
            <FilteredCurrencyValue
              totals={monthlyPayableCurrencyTotals}
              currency={monthlyCurrency}
            />
          ),
          icon: ReceiptText,
          tone: "error",
        },
        {
          label: t("admin.reports.stats.receivables"),
          value: (
            <FilteredCurrencyValue
              totals={monthlyReceivableCurrencyTotals}
              currency={monthlyCurrency}
            />
          ),
          icon: BadgeDollarSign,
          tone: "success",
        },
        {
          label: t("admin.reports.stats.totalAssets"),
          value: (
            <FilteredCurrencyValue
              totals={monthlyAssetCurrencyTotals}
              currency={monthlyCurrency}
            />
          ),
          icon: Landmark,
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
    monthlyAssetCurrencyTotals,
    monthlyBalanceSheet,
    monthlyCashCurrencyTotals,
    monthlyCurrency,
    monthlyPayableCurrencyTotals,
    monthlyReceivableCurrencyTotals,
    payableCurrencyTotals,
    receivableCurrencyTotals,
    t,
  ]);

  // Determine which export buttons to show based on active tab
  const exportActions =
    activeTab === "monthly" ? (
      <ExportButtonGroup
        onExportPdf={() => setMonthlyExportFormat("pdf")}
        onExportExcel={() => setMonthlyExportFormat("csv")}
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
        {/* {activeTab === "summary" ? (
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
        ) : null} */}

        {/* {activeTab === "journal" ? (
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
        ) : null} */}

        {/* {activeTab === "journal" && journalQuery.data?.pagination ? (
          <Pagination
            meta={toPaginationMeta(journalQuery.data.pagination)!}
            onPageChange={setJournalPage}
            onPageSizeChange={(nextPageSize) => {
              setJournalPageSize(nextPageSize);
              setJournalPage(1);
            }}
            disabled={journalQuery.isFetching}
          />
        ) : null} */}

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
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-light-muted dark:text-dark-muted">
                <span>{selectedMonthRange.from}</span>
                <span>-</span>
                <span>{selectedMonthRange.to}</span>
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
            <div className="mt-4 grid gap-2 border-t border-light-border pt-4 dark:border-dark-border sm:grid-cols-3">
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
              <SelectField
                value={monthlyCurrency}
                onValueChange={(value) =>
                  setMonthlyCurrency(value as CurrencyCode | "all")
                }
                options={currencyOptions}
                tone="light"
                clearable={false}
                className="min-h-10 w-full"
                contentClassName="z-[1500]"
              />
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

"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminJournalEntryModal } from "@/components/admin/journals/admin-journal-entry-modal";
import { AdminKpiCard } from "@/components/admin/dashboard/dashboard-panel";
import DataTableEmptyState from "@/components/common/data-table-empty-state";
import { DatePickerField } from "@/components/common/date-picker-field";
import { InputField } from "@/components/common/input-field";
import Pagination from "@/components/common/pagination";
import { SelectField } from "@/components/common/select-field";
import Table from "@/components/common/table";
import TableBody from "@/components/common/table-body";
import TableColumn from "@/components/common/table-column";
import TableHeader from "@/components/common/table-header";
import TableRow from "@/components/common/table-row";
import TableToolbar from "@/components/common/table-tool-bar";
import { ToggleSwitch } from "@/components/common/toggle-switch";
import { CurrencyFlagIcon } from "@/components/common/currency-flag-icon";
import { toPaginationMeta } from "@/lib/admin/pagination-meta";
import { ApiError } from "@/lib/api";
import { getLocalDateString, toIsoDate } from "@/lib/date-format";
import { useI18n } from "@/lib/i18n";
import { useAdminJournalReportQuery } from "@/lib/query/hooks";
import type { CurrencyCode } from "@/services/accounts.service";
import type {
  JournalLineRow,
  JournalSourceType,
  JournalStatus,
} from "@/services/reports-admin.service";
import { gooeyToast } from "goey-toast";
import {
  BookOpenText,
  ReceiptText,
  RefreshCcw,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";

const today = getLocalDateString();
const monthStart = toIsoDate(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1),
);

function absoluteNumberLabel(value: string | number | null | undefined) {
  const parsed = Math.abs(Number(value ?? 0));
  return Number.isFinite(parsed) ? parsed.toLocaleString() : "0";
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
        account?: { id?: string; type?: string } | null;
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
  journals.forEach((journal) =>
    currencyNettedTotals(journal.lines, field).forEach((item) =>
      totals.set(
        item.currencyCode,
        (totals.get(item.currencyCode) ?? 0) + item.total,
      ),
    ),
  );
  return [...totals.entries()].map(([currencyCode, total]) => ({
    currencyCode,
    total,
  }));
}

function journalPaymentDetails(lines: JournalLineRow[] | undefined) {
  const assetLine = (lines ?? []).find((line) =>
    ["cash", "bank", "sarafi", "daskhil"].includes(line.account?.type ?? ""),
  );
  const partner = (lines ?? []).find((line) =>
    ["customer", "vendor", "both"].includes(line.partner?.type ?? ""),
  )?.partner;
  if (!assetLine) return { partner, direction: undefined, amount: "-" };

  const debit = Number(assetLine.debit ?? 0);
  const credit = Number(assetLine.credit ?? 0);
  const amount = Math.max(
    debit,
    credit,
  );
  return {
    partner,
    direction: debit >= credit ? "receive" : "pay",
    amount: `${absoluteNumberLabel(amount)} ${assetLine.currencyCode ?? ""}`.trim(),
  };
}

function SimpleJournalPartner({ lines }: { lines?: JournalLineRow[] }) {
  const { t } = useI18n();
  const { partner, direction } = journalPaymentDetails(lines);
  if (!partner) return <span>-</span>;

  // A partner configured for both roles is labelled by this transaction's cash direction.
  const partnerType =
    partner.type === "both"
      ? direction === "pay"
        ? "vendor"
        : "customer"
      : partner.type;
  const isCustomer = partnerType === "customer";

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span
        className={`rounded-none px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
          isCustomer
            ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400"
            : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
        }`}
      >
        {t(`admin.partners.type.${partnerType}` as never)}
      </span>
      <span
        className={
          isCustomer
            ? "font-semibold text-sky-700 dark:text-sky-400"
            : "font-semibold text-amber-700 dark:text-amber-400"
        }
      >
        {partner.name}
      </span>
    </span>
  );
}

function SimpleJournalAmount({ lines }: { lines?: JournalLineRow[] }) {
  const { t } = useI18n();
  const { amount, direction } = journalPaymentDetails(lines);
  if (!direction || amount === "-") return <span>-</span>;
  const isReceipt = direction === "receive";

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${
        isReceipt
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-rose-700 dark:text-rose-400"
      }`}
    >
      <span className="text-[10px] font-bold uppercase tracking-wide">
        {t(
          `admin.journals.entry.${isReceipt ? "receipt" : "payment"}` as never,
        )}
      </span>
      <span className="font-semibold tabular-nums">{amount}</span>
    </span>
  );
}

function TonePill({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "danger" | "warning" | "info";
}) {
  const className = {
    success:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    danger: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
    warning:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    info: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  }[tone];
  return (
    <span
      className={`inline-flex rounded-none px-2 py-0.5 text-[11px] font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

function CurrencyTotals({
  totals,
  kind,
}: {
  totals: Array<{ currencyCode: string; total: number }>;
  kind: "positive" | "negative";
}) {
  if (!totals.length)
    return <span className="text-light-muted dark:text-dark-muted">0</span>;
  return (
    <span className="flex min-w-0 flex-col items-start gap-1 text-sm">
      {totals.map((item) => (
        <span
          key={`${kind}-${item.currencyCode}`}
          className={`flex items-center gap-1.5 whitespace-nowrap font-semibold ${kind === "positive" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
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

export function AdminJournalsContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState<JournalStatus | "all">("posted");
  const [sourceType, setSourceType] = useState<JournalSourceType | "all">(
    "all",
  );
  const [currency, setCurrency] = useState<CurrencyCode | "all">("all");
  const [number, setNumber] = useState(searchParams.get("journal") ?? "");
  const [entryOpen, setEntryOpen] = useState(false);
  const [simpleView, setSimpleView] = useState(true);
  const journalQuery = useAdminJournalReportQuery({
    page,
    limit: pageSize,
    from: fromDate,
    to: toDate,
    status: status === "all" ? undefined : status,
    sourceType: sourceType === "all" ? undefined : sourceType,
    currencyCode: currency === "all" ? undefined : currency,
    number: number.trim() || undefined,
  });

  useEffect(() => {
    if (!journalQuery.error) return;
    gooeyToast.error(t("admin.reports.toast.loadFailedTitle"), {
      description:
        journalQuery.error instanceof ApiError
          ? journalQuery.error.message
          : t("admin.reports.toast.loadFailedFallback"),
    });
  }, [journalQuery.error, t]);

  const journals = useMemo(
    () => journalQuery.data?.items ?? [],
    [journalQuery.data?.items],
  );
  const visibleDebits = useMemo(
    () => visibleJournalTotals(journals, "debit"),
    [journals],
  );
  const visibleCredits = useMemo(
    () => visibleJournalTotals(journals, "credit"),
    [journals],
  );
  const visibleLines = journals.reduce(
    (sum, journal) => sum + (journal.lines?.length ?? 0),
    0,
  );
  const statusOptions = ["all", "posted", "draft", "reversed", "voided"].map(
    (value) => ({
      value,
      label:
        value === "all"
          ? t("admin.reports.filter.allStatuses")
          : t(`admin.reports.status.${value}` as never),
    }),
  );
  const sourceOptions = [
    "all",
    "manual",
    "sale",
    "purchase",
    "payment",
    "money_transfer",
    "inventory_adjustment",
    "opening_balance",
  ].map((value) => ({
    value,
    label:
      value === "all"
        ? t("admin.reports.filter.allSources")
        : t(
            `admin.reports.source.${value === "money_transfer" ? "moneyTransfer" : value === "inventory_adjustment" ? "inventoryAdjustment" : value === "opening_balance" ? "openingBalance" : value}` as never,
          ),
  }));
  const currencyOptions = ["all", "AFN", "USD", "PKR"].map((value) => ({
    value,
    label: value === "all" ? t("admin.reports.filter.allCurrencies") : value,
  }));

  return (
    <div className="space-y-1">
      <AdminJournalEntryModal
        open={entryOpen}
        onClose={() => setEntryOpen(false)}
      />
      <AdminPageHeader
        eyebrow={t("admin.journals.eyebrow")}
        title={t("admin.journals.title")}
        description={t("admin.journals.description")}
        actions={
          <button
            type="button"
            onClick={() => setEntryOpen(true)}
            className="btn-primary inline-flex min-h-9 items-center gap-2 px-3 text-xs"
          >
            <Plus className="size-4" />
            {t("admin.journals.entry.add")}
          </button>
        }
      />
      <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
        <AdminKpiCard
          label={t("admin.reports.kpi.journals")}
          value={journalQuery.data?.pagination?.total ?? journals.length}
          hint={t("admin.journals.title")}
          icon={ReceiptText}
          tone="neutral"
        />
        <AdminKpiCard
          label={t("admin.reports.details.totalDebit")}
          value={<CurrencyTotals totals={visibleDebits} kind="positive" />}
          icon={TrendingUp}
          tone="success"
        />
        <AdminKpiCard
          label={t("admin.reports.details.totalCredit")}
          value={<CurrencyTotals totals={visibleCredits} kind="negative" />}
          icon={TrendingDown}
          tone="error"
        />
        <AdminKpiCard
          label={t("admin.reports.kpi.visibleLines")}
          value={visibleLines}
          hint={
            status === "all"
              ? t("admin.reports.filter.allStatuses")
              : t(`admin.reports.status.${status}` as never)
          }
          icon={BookOpenText}
          tone="default"
        />
      </div>
      <Table
        toolbar={
          <TableToolbar>
            <TableToolbar.Row>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold text-light-text dark:text-dark-text">
                  {t("admin.journals.title")}
                </span>
                <span className="text-xs text-light-muted dark:text-dark-muted">
                  {t("admin.reports.journal.description")}
                </span>
              </div>
              <div className="flex gap-2.5 items-center">
              <TableToolbar.IconButton
                icon={<RefreshCcw className="size-4" />}
                onClick={() => void journalQuery.refetch()}
              >
                {t("admin.reports.action.refresh")}
              </TableToolbar.IconButton>
              <ToggleSwitch
                id="admin-journals-simple-view"
                checked={simpleView}
                onCheckedChange={setSimpleView}
                label={t("admin.journals.simpleView")}
              />
              </div>
            </TableToolbar.Row>
            <TableToolbar.Row justify="start">
              <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
                <DatePickerField
                  value={fromDate}
                  onChange={(value) => {
                    setFromDate(value);
                    setPage(1);
                  }}
                  tone="light"
                  containerClassName="mb-0"
                  contentClassName="z-[1500]"
                />
                <DatePickerField
                  value={toDate}
                  onChange={(value) => {
                    setToDate(value);
                    setPage(1);
                  }}
                  tone="light"
                  containerClassName="mb-0"
                  contentClassName="z-[1500]"
                />
                <InputField
                  id="admin-journal-number"
                  value={number}
                  onChange={(event) => {
                    setNumber(event.target.value);
                    setPage(1);
                  }}
                  placeholder={t("admin.reports.filter.journalNumber")}
                  tone="light"
                  containerClassName="mb-0"
                  className="min-h-10"
                />
                <SelectField
                  value={status}
                  onValueChange={(value) => {
                    setStatus(value as JournalStatus | "all");
                    setPage(1);
                  }}
                  options={statusOptions}
                  tone="light"
                  clearable={false}
                  className="min-h-10 w-full"
                  contentClassName="z-[1500]"
                />
                <SelectField
                  value={sourceType}
                  onValueChange={(value) => {
                    setSourceType(value as JournalSourceType | "all");
                    setPage(1);
                  }}
                  options={sourceOptions}
                  tone="light"
                  clearable={false}
                  className="min-h-10 w-full"
                  contentClassName="z-[1500]"
                />
                <SelectField
                  value={currency}
                  onValueChange={(value) => {
                    setCurrency(value as CurrencyCode | "all");
                    setPage(1);
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
            "journal",
            "date",
            "description",
            "source",
            "status",
            "createdBy",
            simpleView ? "partner" : "postedBy",
            ...(simpleView ? ["amount"] : []),
          ].map((column) => ({
            title: t(`admin.reports.column.${column}` as never),
            tooltip: t(`admin.reports.columnHelp.${column}` as never),
          }))}
        />
        <TableBody>
          {journals.length === 0 ? (
            <DataTableEmptyState
              colSpan={simpleView ? 8 : 7}
              title={t("admin.reports.empty.journals")}
            />
          ) : (
            journals.map((journal) => (
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
                        label={t(
                          `admin.reports.source.${
                            journal.sourceType === "money_transfer"
                              ? "moneyTransfer"
                              : journal.sourceType === "inventory_adjustment"
                                ? "inventoryAdjustment"
                                : journal.sourceType === "opening_balance"
                                  ? "openingBalance"
                                  : journal.sourceType
                          }` as never,
                        )}
                        tone="info"
                      />
                    )}
                  </TableColumn>
                  <TableColumn>
                    <TonePill
                      label={t(
                        `admin.reports.status.${journal.status}` as never,
                      )}
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
                  <TableColumn>
                    {simpleView ? (
                      <SimpleJournalPartner lines={journal.lines} />
                    ) : (
                      userLabel(journal.postedBy)
                    )}
                  </TableColumn>
                  {simpleView ? (
                    <TableColumn>
                      <SimpleJournalAmount lines={journal.lines} />
                    </TableColumn>
                  ) : null}
                </TableRow>
                {!simpleView ? (
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
                          <div className="text-end">
                            <CurrencyTotals
                              totals={currencyNettedTotals(
                                journal.lines,
                                "debit",
                              )}
                              kind="positive"
                            />
                          </div>
                          <div className="text-end">
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
                ) : null}
              </Fragment>
            ))
          )}
        </TableBody>
      </Table>
      {journalQuery.data?.pagination ? (
        <Pagination
          meta={toPaginationMeta(journalQuery.data.pagination)!}
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
          disabled={journalQuery.isFetching}
        />
      ) : null}
    </div>
  );
}

"use client";

import { gooeyToast } from "goey-toast";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AdminDetailPageSkeleton,
  AdminDetailSection,
  AdminDetailToolbar,
  AdminRecordNotFound,
  formatAdminDate,
} from "@/components/admin/admin-detail-layout";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminKpiCard } from "@/components/admin/dashboard/dashboard-panel";
import { DatePickerField } from "@/components/common/date-picker-field";
import DataTableEmptyState from "@/components/common/data-table-empty-state";
import Pagination from "@/components/common/pagination";
import StatusPill from "@/components/common/status-pill";
import Table from "@/components/common/table";
import TableBody from "@/components/common/table-body";
import TableColumn from "@/components/common/table-column";
import TableHeader from "@/components/common/table-header";
import TableRow from "@/components/common/table-row";
import TableToolbar from "@/components/common/table-tool-bar";
import { toPaginationMeta } from "@/lib/admin/pagination-meta";
import { ApiError } from "@/lib/api";
import { getLocalDateString, toIsoDate } from "@/lib/date-format";
import { useI18n } from "@/lib/i18n";
import {
  useAdminAccountByCodeQuery,
  useAdminAccountLedgerQuery,
} from "@/lib/query/hooks";
import { appRoutes } from "@/routes/app-routes";

type AdminAccountDetailsContentProps = {
  accountCode: string;
};

const today = getLocalDateString();
const monthStart = toIsoDate(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1),
);

function numberLabel(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed.toLocaleString() : "0";
}

function amountToneClass(value: number) {
  return value < 0
    ? "text-rose-700 dark:text-rose-400"
    : value > 0
      ? "text-emerald-700 dark:text-emerald-400"
      : "text-sky-700 dark:text-sky-400";
}

function dateLabel(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

const documentReferencePattern = /\b(JRN|PUR|SAL)-(\d+)\b/g;

function documentHref(reference: string) {
  if (reference.startsWith("JRN-")) {
    return `${appRoutes.adminJournals}?journal=${encodeURIComponent(reference)}`;
  }
  if (reference.startsWith("PUR-")) {
    return `${appRoutes.adminPurchases}/${encodeURIComponent(reference)}/details`;
  }
  if (reference.startsWith("SAL-")) {
    return `${appRoutes.adminSales}/${encodeURIComponent(reference)}/details`;
  }
  return null;
}

function LinkedDescription({ value }: { value: string }) {
  const parts = value.split(documentReferencePattern);

  return (
    <>
      {parts.map((part, index) => {
        const nextPart = parts[index + 1];
        const reference =
          (part === "JRN" || part === "PUR" || part === "SAL") &&
          /^\d+$/.test(nextPart ?? "")
            ? `${part}-${nextPart}`
            : null;
        const href = reference ? documentHref(reference) : null;

        if (href) {
          return (
            <Link
              key={`${reference}-${index}`}
              href={href}
              className="font-semibold text-primary underline decoration-primary/35 underline-offset-2 hover:decoration-primary"
            >
              {reference}
            </Link>
          );
        }
        if (
          /^\d+$/.test(part) &&
          (parts[index - 1] === "JRN" ||
            parts[index - 1] === "PUR" ||
            parts[index - 1] === "SAL")
        ) {
          return null;
        }
        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </>
  );
}

export function AdminAccountDetailsContent({
  accountCode,
}: AdminAccountDetailsContentProps) {
  const { t } = useI18n();
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const accountQuery = useAdminAccountByCodeQuery(accountCode);
  const accountId = accountQuery.data?.id ?? "";
  const ledgerQuery = useAdminAccountLedgerQuery(
    {
      accountId,
      from: fromDate,
      to: toDate,
      page,
      limit: pageSize,
    },
    Boolean(accountId),
  );

  useEffect(() => {
    const error = accountQuery.error ?? ledgerQuery.error;
    if (!error) return;
    gooeyToast.error(t("admin.accounts.details.loadFailedTitle"), {
      description:
        error instanceof ApiError
          ? error.message
          : t("admin.accounts.details.loadFailedFallback"),
    });
  }, [accountQuery.error, ledgerQuery.error, t]);

  const account = accountQuery.data;
  const ledger = ledgerQuery.data;
  const balanceRows = useMemo(
    () => account?.balances ?? [],
    [account?.balances],
  );
  const totalBalance = useMemo(
    () => balanceRows.reduce((sum, row) => sum + Number(row.balance ?? 0), 0),
    [balanceRows],
  );
  const ledgerRows = ledger?.items ?? [];
  const pagination = toPaginationMeta(ledger?.pagination);

  if (accountQuery.isLoading) return <AdminDetailPageSkeleton />;

  if (accountQuery.isError || !account) {
    return (
      <AdminRecordNotFound
        backHref={appRoutes.adminAccounts}
        backLabel={t("admin.accounts.details.back")}
        message={t("admin.accounts.details.notFound")}
      />
    );
  }

  return (
    <div className="space-y-1">
      <AdminDetailToolbar
        backHref={appRoutes.adminAccounts}
        backLabel={t("admin.accounts.details.back")}
        onRefresh={() => {
          void accountQuery.refetch();
          void ledgerQuery.refetch();
        }}
      />

      <AdminPageHeader
        eyebrow={`${t("admin.accounts.eyebrow")} ${account.code}`}
        title={account.name}
        description={`${t(`admin.accounts.category.${account.category}` as never)} / ${t(`admin.accounts.type.${account.type}` as never)}`}
        actions={
          <StatusPill
            label={
              account.isActive
                ? t("admin.accounts.status.active")
                : t("admin.accounts.status.inactive")
            }
            variant={account.isActive ? "success" : "neutral"}
          />
        }
      />

      <div className="grid gap-1 grid-cols-1 md:grid-cols-3 xl:grid-cols-4">
        <AdminKpiCard
          label={t("admin.accounts.details.totalBalance")}
          value={numberLabel(totalBalance)}
          hint={account.currencyCode ?? "-"}
          icon={WalletCards}
          tone={totalBalance >= 0 ? "success" : "error"}
        />
        <AdminKpiCard
          label={t("admin.accounts.details.totalDebit")}
          value={numberLabel(ledger?.summary.totalDebit)}
          icon={ArrowDownToLine}
          tone="success"
        />
        <AdminKpiCard
          label={t("admin.accounts.details.totalCredit")}
          value={numberLabel(ledger?.summary.totalCredit)}
          icon={ArrowUpFromLine}
          tone="warning"
        />
        <AdminKpiCard
          label={t("admin.accounts.details.transactions")}
          value={ledger?.pagination?.total ?? ledgerRows.length}
          hint={t("admin.accounts.details.selectedPeriod")}
          icon={Activity}
          tone="neutral"
        />
      </div>

      <AdminDetailSection title={t("admin.accounts.details.overview")}>
        <Table>
          <TableHeader
            headerData={[
              { title: t("admin.accounts.column.code") },
              { title: t("admin.accounts.column.name") },
              { title: t("admin.accounts.column.category") },
              { title: t("admin.accounts.column.type") },
              { title: t("admin.accounts.column.normalBalance") },
              { title: t("admin.accounts.column.currency") },
              { title: t("admin.accounts.column.parent") },
              { title: t("admin.accounts.column.control") },
              { title: t("admin.accounts.details.created") },
              { title: t("admin.accounts.details.updated") },
            ]}
          />
          <TableBody>
            <TableRow>
              <TableColumn nowrap={false}>{account.code}</TableColumn>
              <TableColumn nowrap={false}>{account.name}</TableColumn>
              <TableColumn nowrap={false}>
                {t(`admin.accounts.category.${account.category}` as never)}
              </TableColumn>
              <TableColumn nowrap={false}>
                {t(`admin.accounts.type.${account.type}` as never)}
              </TableColumn>
              <TableColumn nowrap={false}>
                {t(`admin.accounts.balance.${account.normalBalance}` as never)}
              </TableColumn>
              <TableColumn nowrap={false}>
                {account.currencyCode ?? "-"}
              </TableColumn>
              <TableColumn nowrap={false}>
                {account.parent?.name ?? "-"}
              </TableColumn>
              <TableColumn nowrap={false}>
                {account.isControlAccount
                  ? t("admin.accounts.details.yes")
                  : t("admin.accounts.details.no")}
              </TableColumn>
              <TableColumn nowrap={false}>
                {formatAdminDate(account.createdAt)}
              </TableColumn>
              <TableColumn nowrap={false}>
                {formatAdminDate(account.updatedAt)}
              </TableColumn>
            </TableRow>
          </TableBody>
        </Table>
      </AdminDetailSection>

      <Table
        toolbar={
          <TableToolbar>
            <TableToolbar.Row>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold text-light-text dark:text-dark-text">
                  {t("admin.accounts.details.ledger")}
                </span>
                <span className="text-xs text-light-muted dark:text-dark-muted">
                  {t("admin.accounts.details.ledgerDescription")}
                </span>
              </div>
            </TableToolbar.Row>
            <TableToolbar.Row justify="start">
              <TableToolbar.Section className="grid w-full gap-2 sm:grid-cols-2 lg:max-w-xl">
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
              </TableToolbar.Section>
            </TableToolbar.Row>
          </TableToolbar>
        }
      >
        <TableHeader
          headerData={[
            { title: t("admin.reports.column.date") },
            { title: t("admin.reports.column.journal") },
            { title: t("admin.reports.column.description") },
            { title: t("admin.reports.column.partner") },
            { title: t("admin.reports.column.debit") },
            { title: t("admin.reports.column.credit") },
            { title: t("admin.reports.column.balance") },
          ]}
        />
        <TableBody>
          <TableRow>
            <TableColumn className="font-semibold">
              {t("admin.reports.ledger.opening")}
            </TableColumn>
            <TableColumn>-</TableColumn>
            <TableColumn nowrap={false}>{account.name}</TableColumn>
            <TableColumn>-</TableColumn>
            <TableColumn className="font-semibold text-emerald-700 dark:text-emerald-400">
              -
            </TableColumn>
            <TableColumn className="font-semibold text-rose-700 dark:text-rose-400">
              -
            </TableColumn>
            <TableColumn
              className={`font-semibold ${amountToneClass(Number(ledger?.summary.openingBalance ?? 0))}`}
            >
              {numberLabel(ledger?.summary.openingBalance)}
            </TableColumn>
          </TableRow>
          {ledgerRows.length === 0 ? (
            <DataTableEmptyState
              colSpan={7}
              title={t("admin.accounts.details.emptyLedger")}
            />
          ) : (
            ledgerRows.map((line) => (
              <TableRow key={line.id}>
                <TableColumn>
                  {dateLabel(line.journalEntry?.entryDate)}
                </TableColumn>
                <TableColumn>
                  {line.journalEntry?.number ? (
                    <Link
                      href={`${appRoutes.adminJournals}?journal=${encodeURIComponent(line.journalEntry.number)}`}
                      className="font-mono text-xs font-semibold text-primary underline decoration-primary/35 underline-offset-2 hover:decoration-primary"
                    >
                      {line.journalEntry.number}
                    </Link>
                  ) : (
                    "-"
                  )}
                </TableColumn>
                <TableColumn nowrap={false}>
                  <LinkedDescription
                    value={line.journalEntry?.description ?? line.memo ?? "-"}
                  />
                </TableColumn>
                <TableColumn>{line.partner?.name ?? "-"}</TableColumn>
                <TableColumn className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {numberLabel(line.debit)} {line.currencyCode}
                </TableColumn>
                <TableColumn className="font-semibold text-rose-700 dark:text-rose-400">
                  {numberLabel(line.credit)} {line.currencyCode}
                </TableColumn>
                <TableColumn
                  className={`font-semibold ${amountToneClass(Number(line.runningBalance ?? 0))}`}
                >
                  {numberLabel(line.runningBalance)} {line.currencyCode}
                </TableColumn>
              </TableRow>
            ))
          )}
          <TableRow>
            <TableColumn colSpan={4} className="font-semibold">
              {t("admin.reports.ledger.closing")}
            </TableColumn>
            <TableColumn className="font-semibold text-emerald-700 dark:text-emerald-400">
              {numberLabel(ledger?.summary.totalDebit)}
            </TableColumn>
            <TableColumn className="font-semibold text-rose-700 dark:text-rose-400">
              {numberLabel(ledger?.summary.totalCredit)}
            </TableColumn>
            <TableColumn
              className={`font-semibold ${amountToneClass(Number(ledger?.summary.closingBalance ?? 0))}`}
            >
              {numberLabel(ledger?.summary.closingBalance)}
            </TableColumn>
          </TableRow>
        </TableBody>
      </Table>
      {pagination ? (
        <Pagination
          meta={pagination}
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
          disabled={ledgerQuery.isFetching}
        />
      ) : null}

      <AdminDetailSection title={t("admin.accounts.details.balances")}>
        <Table>
          <TableHeader
            headerData={[
              { title: t("admin.accounts.column.currency") },
              { title: t("admin.reports.column.debit"), align: "end" as const },
              {
                title: t("admin.reports.column.credit"),
                align: "end" as const,
              },
              {
                title: t("admin.reports.column.balance"),
                align: "end" as const,
              },
            ]}
          />
          <TableBody>
            {balanceRows.length === 0 ? (
              <DataTableEmptyState
                colSpan={4}
                title={t("admin.accounts.details.noBalances")}
              />
            ) : (
              balanceRows.map((row) => (
                <TableRow key={`${account.id}-${row.currencyCode}`}>
                  <TableColumn>{row.currencyCode}</TableColumn>
                  <TableColumn className="text-right font-semibold text-emerald-700 dark:text-emerald-400">
                    {numberLabel(row.debitTotal)}
                  </TableColumn>
                  <TableColumn className="text-right font-semibold text-rose-700 dark:text-rose-400">
                    {numberLabel(row.creditTotal)}
                  </TableColumn>
                  <TableColumn
                    className={`text-right font-semibold ${amountToneClass(Number(row.balance ?? 0))}`}
                  >
                    {numberLabel(row.balance)}
                  </TableColumn>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminDetailSection>
    </div>
  );
}

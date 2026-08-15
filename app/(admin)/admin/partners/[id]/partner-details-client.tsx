"use client";

import { useState, type ReactNode } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  Banknote,
  ChevronDown,
  ChevronUp,
  Landmark,
  ReceiptText,
  Users,
  WalletCards,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AdminDetailSection,
  AdminDetailToolbar,
  AdminRecordNotFound,
  formatAdminDate,
} from "@/components/admin/admin-detail-layout";
import { AdminKpiCard } from "@/components/admin/dashboard/dashboard-panel";
import { AdminPurchasePaymentModal } from "@/components/admin/purchases/admin-purchase-payment-modal";
import { AdminSalePaymentModal } from "@/components/admin/sales/admin-sale-payment-modal";
import DataTableEmptyState from "@/components/common/data-table-empty-state";
import StatusPill from "@/components/common/status-pill";
import Table from "@/components/common/table";
import TableBody from "@/components/common/table-body";
import TableColumn from "@/components/common/table-column";
import TableHeader from "@/components/common/table-header";
import TableRow from "@/components/common/table-row";
import {
  useAdminFinancialSummaryQuery,
  useAdminAccountsQuery,
  useAdminJournalReportQuery,
  useAdminPartnersQuery,
  useAdminPurchasesQuery,
  useAdminSalesQuery,
} from "@/lib/query/hooks";
import { useI18n } from "@/lib/i18n";
import type { CurrencyCode } from "@/services/accounts.service";
import type { PartnerBalanceRow } from "@/services/reports-admin.service";
import { fetchPurchaseByNumber } from "@/services/purchases.service";
import { fetchSaleByNumber } from "@/services/sales.service";

type Props = {
  partnerId: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  collapsibleTransactionHistory?: boolean;
};

function money(value: string | number | undefined, currency?: string) {
  const parsed = Number(value ?? 0);
  return `${Number.isFinite(parsed) ? parsed.toLocaleString() : "0"} ${currency ?? ""}`.trim();
}

function CurrencyAmounts({
  values,
}: {
  values: Array<{ currency: CurrencyCode; amount: number }>;
}) {
  if (values.length === 0) return "0";

  return (
    <span className="flex flex-col gap-0.5">
      {values.map(({ currency, amount }) => (
        <span key={currency}>{money(amount, currency)}</span>
      ))}
    </span>
  );
}

function partnerBalance(rows: PartnerBalanceRow[], partnerId: string) {
  return rows.filter((row) => row.partner?.id === partnerId);
}

function groupedTotal(
  rows: Array<{
    currencyCode: CurrencyCode;
    total?: string | number;
    paidTotal?: string | number;
  }>,
  field: "total" | "paid" | "balance",
) {
  const totals = new Map<CurrencyCode, { total: number; paid: number }>();
  rows.forEach((row) => {
    const current = totals.get(row.currencyCode) ?? { total: 0, paid: 0 };
    current.total += Number(row.total ?? 0);
    current.paid += Number(row.paidTotal ?? 0);
    totals.set(row.currencyCode, current);
  });
  return (
    <CurrencyAmounts
      values={[...totals.entries()].map(([currency, value]) => {
        const amount =
          field === "total"
            ? value.total
            : field === "paid"
              ? value.paid
              : value.total - value.paid;
        return { currency, amount };
      })}
    />
  );
}

function balanceTotal(rows: PartnerBalanceRow[]) {
  const totals = new Map<CurrencyCode, number>();
  rows.forEach((row) => {
    const balance = Math.abs(Number(row.balance ?? 0));
    if (balance <= 0) return;
    totals.set(row.currencyCode, (totals.get(row.currencyCode) ?? 0) + balance);
  });
  return (
    <CurrencyAmounts
      values={[...totals.entries()].map(([currency, amount]) => ({
        currency,
        amount,
      }))}
    />
  );
}

function parseDate(value?: string | null) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.getTime() : 0;
}

function MoneyText({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "incoming" | "outgoing" | "settled";
}) {
  return (
    <span
      className={
        tone === "settled"
          ? "font-semibold text-sky-700 dark:text-sky-400"
          : tone === "incoming"
            ? "font-semibold text-emerald-700 dark:text-emerald-400"
            : "font-semibold text-red-700 dark:text-red-400"
      }
    >
      {children}
    </span>
  );
}

function TypePill({
  tone,
  label,
}: {
  tone: "incoming" | "outgoing";
  label: string;
}) {
  return (
    <span
      className={
        tone === "incoming"
          ? "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
          : "inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-400"
      }
    >
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

function BalanceTable({
  items,
  t,
}: {
  items: Array<{
    label: string;
    rows: PartnerBalanceRow[];
    tone: "incoming" | "outgoing";
  }>;
  t: ReturnType<typeof useI18n>["t"];
}) {
  return (
    <Table>
      <TableHeader
        headerData={[
          { title: t("admin.partners.details.accountType") },
          { title: t("admin.partners.details.accountMeaning") },
          { title: t("admin.reports.column.currency") },
          {
            title: t("admin.reports.column.totalAmount"),
            align: "end" as const,
          },
          {
            title: t("admin.partners.details.settledAmount"),
            align: "end" as const,
          },
          {
            title: t("admin.partners.details.outstandingAmount"),
            align: "end" as const,
          },
        ]}
      />
      <TableBody>
        {items.every((item) => item.rows.length === 0) ? (
          <DataTableEmptyState
            colSpan={6}
            title={t("admin.partners.details.emptyBalances")}
          />
        ) : (
          items.flatMap((item) =>
            item.rows.map((row) => {
              const totalAmount =
                item.tone === "incoming"
                  ? Number(row.debitTotal ?? 0)
                  : Number(row.creditTotal ?? 0);
              const settledAmount =
                item.tone === "incoming"
                  ? Number(row.creditTotal ?? 0)
                  : Number(row.debitTotal ?? 0);
              const outstandingAmount = Math.abs(Number(row.balance ?? 0));
              const meaningKey =
                outstandingAmount > 0
                  ? item.tone === "incoming"
                    ? "admin.partners.details.receivablePlain"
                    : "admin.partners.details.payablePlain"
                  : "admin.partners.details.settledPlain";
              const amountTone = outstandingAmount > 0 ? item.tone : "settled";

              return (
                <TableRow
                  key={`${item.label}-${row.currencyCode}`}
                  className={
                    item.tone === "incoming"
                      ? "bg-emerald-50/60 dark:bg-emerald-500/5"
                      : "bg-red-50/60 dark:bg-red-500/5"
                  }
                >
                  <TableColumn
                    className={
                      item.tone === "incoming"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-red-700 dark:text-red-400"
                    }
                  >
                    {item.label}
                  </TableColumn>
                  <TableColumn nowrap={false}>
                    {t(meaningKey as never)}
                  </TableColumn>
                  <TableColumn>{row.currencyCode}</TableColumn>
                  <TableColumn className="">
                    {money(totalAmount, row.currencyCode)}
                  </TableColumn>
                  <TableColumn className="">
                    {money(settledAmount, row.currencyCode)}
                  </TableColumn>
                  <TableColumn className=" font-semibold">
                    <MoneyText tone={amountTone}>
                      {money(outstandingAmount, row.currencyCode)}
                    </MoneyText>
                  </TableColumn>
                </TableRow>
              );
            }),
          )
        )}
      </TableBody>
    </Table>
  );
}

export function AdminPartnerDetailsContent({
  partnerId,
  backHref: backHrefOverride,
  backLabel: backLabelOverride,
  actions,
  collapsibleTransactionHistory = false,
}: Props) {
  const { t } = useI18n();
  const [salePaymentOpen, setSalePaymentOpen] = useState(false);
  const [purchasePaymentOpen, setPurchasePaymentOpen] = useState(false);
  const [transactionHistoryOpen, setTransactionHistoryOpen] = useState(
    !collapsibleTransactionHistory,
  );
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const contextBackHref =
    returnTo === "sales"
      ? "/admin/sales"
      : returnTo === "purchases"
        ? "/admin/purchases"
        : "/admin/partners";
  const contextBackLabel =
    returnTo === "sales"
      ? t("admin.sales.details.back")
      : returnTo === "purchases"
        ? t("admin.purchase.details.back")
        : t("admin.partners.details.back");
  const backHref = backHrefOverride ?? contextBackHref;
  const backLabel = backLabelOverride ?? contextBackLabel;
  const partnersQuery = useAdminPartnersQuery({ page: 1, limit: 100 });
  const summaryQuery = useAdminFinancialSummaryQuery();
  const journalsQuery = useAdminJournalReportQuery({ partnerId, limit: 100 });
  const salesQuery = useAdminSalesQuery({ customerId: partnerId, limit: 100 });
  const purchasesQuery = useAdminPurchasesQuery({
    vendorId: partnerId,
    limit: 100,
  });
  const accountsQuery = useAdminAccountsQuery({ limit: 100, isActive: true });
  const partner = partnersQuery.data?.items.find(
    (item) => item.id === partnerId,
  );
  const loading = partnersQuery.isLoading || summaryQuery.isLoading;

  const receivableRows = partnerBalance(
    summaryQuery.data?.receivables.rows ?? [],
    partnerId,
  );
  const payableRows = partnerBalance(
    summaryQuery.data?.payables.rows ?? [],
    partnerId,
  );
  const sales = salesQuery.data?.items ?? [];
  const purchases = purchasesQuery.data?.items ?? [];
  const transactionQueries = useQueries({
    queries: [
      ...sales.map((sale) => ({
        queryKey: ["partner-history", "sale", sale.number],
        queryFn: () => fetchSaleByNumber(sale.number),
      })),
      ...purchases.map((purchase) => ({
        queryKey: ["partner-history", "purchase", purchase.number],
        queryFn: () => fetchPurchaseByNumber(purchase.number),
      })),
    ],
  });
  const productNamesByDocument = new Map(
    transactionQueries.map((query, index) => {
      const document = query.data;
      const kind = index < sales.length ? "sale" : "purchase";
      const number =
        kind === "sale"
          ? sales[index]?.number
          : purchases[index - sales.length]?.number;
      return [
        `${kind}-${number}`,
        (document?.lines ?? [])
          .map((line) => line.product?.name ?? line.description)
          .filter((name): name is string => Boolean(name))
          .join(", "),
      ];
    }),
  );

  if (!loading && !partner) {
    return (
      <AdminRecordNotFound
        backHref={backHref}
        backLabel={backLabel}
        message={t("admin.partners.details.loadFailedFallback")}
      />
    );
  }

  const tradeRows = [
    ...sales.map((sale) => ({
      kind: "sale" as const,
      number: sale.number,
      date: sale.invoiceDate,
      total: sale.total,
      paidTotal: sale.paidTotal,
      currencyCode: sale.currencyCode,
      products: productNamesByDocument.get(`sale-${sale.number}`) ?? "",
    })),
    ...purchases.map((purchase) => ({
      kind: "purchase" as const,
      number: purchase.number,
      date: purchase.billDate,
      total: purchase.total,
      paidTotal: purchase.paidTotal,
      currencyCode: purchase.currencyCode,
      products: productNamesByDocument.get(`purchase-${purchase.number}`) ?? "",
    })),
  ].sort((a, b) => parseDate(b.date) - parseDate(a.date));
  const journals = journalsQuery.data?.items ?? [];
  const outstandingSale = sales.find(
    (sale) =>
      sale.status !== "cancelled" &&
      Number(sale.total) - Number(sale.paidTotal) > 0,
  );
  const outstandingPurchase = purchases.find(
    (purchase) =>
      purchase.status !== "cancelled" &&
      Number(purchase.total) - Number(purchase.paidTotal) > 0,
  );
  const partnerPaymentActions = (
    <>
      {outstandingSale ? (
        <button
          type="button"
          onClick={() => setSalePaymentOpen(true)}
          className="btn-primary inline-flex min-h-9 items-center gap-2 px-3 text-xs"
        >
          <Banknote className="size-4" />
          {t("admin.sales.action.receivePayment")}
        </button>
      ) : null}
      {outstandingPurchase ? (
        <button
          type="button"
          onClick={() => setPurchasePaymentOpen(true)}
          className="inline-flex min-h-9 items-center gap-2 border border-primary-500/30 bg-light-surface px-3 text-xs font-semibold text-primary-600 transition hover:bg-primary-50 dark:bg-dark-surface dark:text-primary-500 dark:hover:bg-primary-500/10"
        >
          <Banknote className="size-4" />
          {t("admin.purchases.action.pay")}
        </button>
      ) : null}
    </>
  );
  const isCustomer = partner?.type === "customer" || partner?.type === "both";
  const isVendor = partner?.type === "vendor" || partner?.type === "both";
  const summaryCards = [
    ...(isCustomer
      ? [
          {
            label: t("admin.partners.details.totalSales"),
            value: groupedTotal(sales, "total"),
            icon: ReceiptText,
            tone: "success" as const,
          },
          {
            label: t("admin.partners.details.customerOwesUs"),
            value: balanceTotal(receivableRows),
            icon: WalletCards,
            tone: "warning" as const,
          },
          {
            label: t("admin.partners.details.paymentsReceived"),
            value: groupedTotal(sales, "paid"),
            icon: Banknote,
            tone: "success" as const,
          },
        ]
      : []),
    ...(isVendor
      ? [
          {
            label: t("admin.partners.details.totalPurchases"),
            value: groupedTotal(purchases, "total"),
            icon: ReceiptText,
            tone: "neutral" as const,
          },
          {
            label: t("admin.partners.details.weOweSupplier"),
            value: balanceTotal(payableRows),
            icon: Landmark,
            tone: "warning" as const,
          },
          {
            label: t("admin.partners.details.paymentsMade"),
            value: groupedTotal(purchases, "paid"),
            icon: Banknote,
            tone: "neutral" as const,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-1">
      <AdminSalePaymentModal
        accounts={accountsQuery.data ?? []}
        open={salePaymentOpen}
        sale={outstandingSale ?? null}
        sales={sales}
        onClose={() => setSalePaymentOpen(false)}
      />
      <AdminPurchasePaymentModal
        accounts={accountsQuery.data ?? []}
        open={purchasePaymentOpen}
        purchase={outstandingPurchase ?? null}
        purchases={purchases}
        onClose={() => setPurchasePaymentOpen(false)}
      />
      <AdminDetailToolbar
        backHref={backHref}
        backLabel={backLabel}
        onRefresh={() => {
          void partnersQuery.refetch();
          void summaryQuery.refetch();
          void journalsQuery.refetch();
          void salesQuery.refetch();
          void purchasesQuery.refetch();
        }}
        actions={
          <>
            {actions}
            {partnerPaymentActions}
          </>
        }
      />

      <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <AdminKpiCard key={card.label} {...card} />
        ))}
      </div>

      <AdminDetailSection
        title={partner?.name ?? t("admin.partners.details.title")}
        description={t("admin.partners.details.description")}
      >
        <DetailSummaryTable
          rows={[
            {
              label: t("admin.partners.column.code"),
              value: partner?.code ?? "-",
            },
            {
              label: t("admin.partners.column.type"),
              value: t(
                `admin.partners.type.${partner?.type ?? "customer"}` as never,
              ),
            },
            {
              label: t("admin.partners.column.status"),
              value: (
                <StatusPill
                  label={
                    partner?.isActive
                      ? t("admin.partners.status.active")
                      : t("admin.partners.status.inactive")
                  }
                  variant={partner?.isActive ? "success" : "neutral"}
                />
              ),
            },
            {
              label: t("admin.partners.column.phone"),
              value: partner?.phone ?? "-",
            },
            {
              label: t("admin.partners.column.address"),
              value: partner?.address ?? "-",
            },
            {
              label: t("admin.partners.details.ledgerAccounts"),
              value: partner?.ledgerAccounts?.length ?? 0,
            },
            {
              label: t("admin.partners.details.receivableAccount"),
              value: partner?.receivableAccount?.name ?? "-",
            },
            {
              label: t("admin.partners.details.payableAccount"),
              value: partner?.payableAccount?.name ?? "-",
            },
            {
              label: t("admin.partners.details.currencyAccounts"),
              value:
                (partner?.ledgerAccounts ?? [])
                  .map((item) => `${item.currencyCode} ${item.type}`)
                  .join(", ") || "-",
            },
          ]}
        />
      </AdminDetailSection>

      <AdminDetailSection
        title={t("admin.partners.details.accountBalances")}
        description={t("admin.partners.details.accountBalancesDescription")}
      >
        <BalanceTable
          items={[
            {
              label: t("admin.partners.details.receivableSection"),
              rows: receivableRows,
              tone: "incoming",
            },
            {
              label: t("admin.partners.details.payableSection"),
              rows: payableRows,
              tone: "outgoing",
            },
          ]}
          t={t}
        />
      </AdminDetailSection>

      <AdminDetailSection
        title={t("admin.partners.details.transactionHistory")}
        description={t("admin.partners.details.transactionDescription")}
        actions={
          collapsibleTransactionHistory ? (
            <button
              type="button"
              aria-expanded={transactionHistoryOpen}
              onClick={() => setTransactionHistoryOpen((open) => !open)}
              className="inline-flex min-h-9 items-center gap-2 border border-light-border bg-light-bg px-3 text-xs font-semibold text-light-text transition hover:border-primary-500/40 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text"
            >
              {transactionHistoryOpen ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
              {transactionHistoryOpen
                ? t("admin.partners.details.hideTransactionHistory")
                : t("admin.partners.details.showTransactionHistory")}
            </button>
          ) : null
        }
      >
        {transactionHistoryOpen ? (
          <Table>
            <TableHeader
              headerData={[
                { title: t("admin.reports.column.journal") },
                { title: t("admin.reports.column.date") },
                { title: t("admin.reports.column.source") },
                { title: t("admin.reports.column.status") },
              ]}
            />
            <TableBody>
              {journals.length === 0 ? (
                <DataTableEmptyState
                  colSpan={4}
                  title={t("admin.partners.details.emptyJournals")}
                />
              ) : (
                journals.map((journal) => (
                  <TableRow key={journal.id}>
                    <TableColumn>{journal.number}</TableColumn>
                    <TableColumn>
                      {formatAdminDate(journal.entryDate)}
                    </TableColumn>
                    <TableColumn>
                      {t(
                        `admin.reports.source.${journal.sourceType === "money_transfer" ? "moneyTransfer" : journal.sourceType === "inventory_adjustment" ? "inventoryAdjustment" : journal.sourceType === "opening_balance" ? "openingBalance" : journal.sourceType}` as never,
                      )}
                    </TableColumn>
                    <TableColumn>
                      {t(`admin.reports.status.${journal.status}` as never)}
                    </TableColumn>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        ) : null}
      </AdminDetailSection>

      <AdminDetailSection
        title={t("admin.partners.details.recentActivity")}
        description={t("admin.partners.details.recentActivityDescription")}
      >
        <Table>
          <TableHeader
            headerData={[
              { title: t("admin.partners.details.activityType") },
              { title: t("admin.partners.details.activityDocument") },
              { title: t("admin.reports.column.date") },
              {
                title: t("admin.reports.column.totalAmount"),
                align: "end" as const,
              },
              {
                title: t("admin.reports.column.balance"),
                align: "end" as const,
              },
            ]}
          />
          <TableBody>
            {tradeRows.length === 0 ? (
              <DataTableEmptyState
                colSpan={5}
                title={t("admin.partners.details.emptyActivity")}
              />
            ) : (
              tradeRows.map((row) => (
                <TableRow key={`${row.kind}-${row.number}-${row.date}`}>
                  <TableColumn>
                    <TypePill
                      tone={row.kind === "sale" ? "incoming" : "outgoing"}
                      label={
                        row.kind === "sale"
                          ? t("admin.partners.details.activitySale")
                          : t("admin.partners.details.activityPurchase")
                      }
                    />
                  </TableColumn>
                  <TableColumn nowrap={false}>
                    <Link
                      href={`/admin/${row.kind === "sale" ? "sales" : "purchases"}/${encodeURIComponent(row.number)}/details`}
                      className="font-mono text-xs font-semibold text-primary-600 hover:underline dark:text-primary-500"
                    >
                      {row.number}
                    </Link>
                    <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">
                      {row.products || "-"}
                    </p>
                  </TableColumn>
                  <TableColumn>{formatAdminDate(row.date)}</TableColumn>
                  <TableColumn className="">
                    {money(row.total, row.currencyCode)}
                  </TableColumn>
                  <TableColumn className="">
                    <MoneyText
                      tone={row.kind === "sale" ? "incoming" : "outgoing"}
                    >
                      {money(
                        Number(row.total) - Number(row.paidTotal),
                        row.currencyCode,
                      )}
                    </MoneyText>
                  </TableColumn>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminDetailSection>

      <AdminDetailSection
        title={t("admin.partners.details.paymentsAndLedger")}
        description={t("admin.partners.details.paymentsAndLedgerDescription")}
      >
        <Table>
          <TableHeader
            headerData={[
              {
                title: t("admin.partners.details.paymentsReceived"),
                align: "end" as const,
              },
              {
                title: t("admin.partners.details.paymentsMade"),
                align: "end" as const,
              },
              {
                title: t("admin.partners.details.journalEntries"),
                align: "end" as const,
              },
            ]}
          />
          <TableBody>
            <TableRow>
              <TableColumn className="">
                <MoneyText tone="incoming">
                  {groupedTotal(sales, "paid")}
                </MoneyText>
              </TableColumn>
              <TableColumn className="">
                <MoneyText tone="outgoing">
                  {groupedTotal(purchases, "paid")}
                </MoneyText>
              </TableColumn>
              <TableColumn className="">
                <span className="inline-flex items-center justify-end gap-1 font-semibold">
                  <Users className="size-4" /> {journals.length}
                </span>
              </TableColumn>
            </TableRow>
          </TableBody>
        </Table>
      </AdminDetailSection>
    </div>
  );
}

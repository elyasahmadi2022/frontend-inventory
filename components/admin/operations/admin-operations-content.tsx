"use client";

import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, ListChecks } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminKpiCard } from "@/components/admin/dashboard/dashboard-panel";
import { formatAdminNumber, groupCurrencyAmounts, renderCurrencyAmountList } from "@/components/admin/shared/admin-money-display";
import DataTableEmptyState from "@/components/common/data-table-empty-state";
import Pagination from "@/components/common/pagination";
import { SelectField } from "@/components/common/select-field";
import Table from "@/components/common/table";
import TableBody from "@/components/common/table-body";
import TableColumn from "@/components/common/table-column";
import TableHeader from "@/components/common/table-header";
import TableRow from "@/components/common/table-row";
import TableToolbar from "@/components/common/table-tool-bar";
import { toPaginationMeta } from "@/lib/admin/pagination-meta";
import { useI18n } from "@/lib/i18n";
import { useAdminOperationsQuery } from "@/lib/query/hooks";
import type { OperationFilter, OperationKind, OperationRow } from "@/services/operations.service";

function accountLabel(account?: OperationRow["fromAccount"]) {
  return account ? `${account.code} - ${account.name}` : "-";
}

export function AdminOperationsContent() {
  const { language, t } = useI18n();
  const [kind, setKind] = useState<OperationFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const query = useAdminOperationsQuery({ kind, page, limit: pageSize });
  const rows = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const received = useMemo(() => groupCurrencyAmounts(rows.filter((row) => row.direction === "receive").map((row) => ({ currencyCode: row.currencyCode, amount: row.amount }))), [rows]);
  const paid = useMemo(() => groupCurrencyAmounts(rows.filter((row) => row.direction === "pay").map((row) => ({ currencyCode: row.currencyCode, amount: row.amount }))), [rows]);
  const transferred = useMemo(() => groupCurrencyAmounts(rows.filter((row) => row.direction === "transfer").map((row) => ({ currencyCode: row.currencyCode, amount: row.amount }))), [rows]);
  const kindOptions = [
    { value: "all", label: t("admin.operations.filter.all") },
    { value: "payment", label: t("admin.operations.filter.payments") },
    { value: "transfer", label: t("admin.operations.filter.transfers") },
  ];
  const kindLabel = (value: OperationKind) => t(`admin.operations.kind.${value}` as never);

  return (
    <div className="space-y-1">
      <AdminPageHeader eyebrow={t("admin.operations.eyebrow")} title={t("admin.operations.title")} description={t("admin.operations.description")} />
      <div className="grid gap-1 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        <AdminKpiCard label={t("admin.operations.stats.operations")} value={formatAdminNumber(query.data?.pagination?.total ?? rows.length, language)} icon={ListChecks} />
        <AdminKpiCard label={t("admin.operations.stats.received")} value={renderCurrencyAmountList(received, language)} icon={ArrowDownLeft} tone="success" />
        <AdminKpiCard label={t("admin.operations.stats.paid")} value={renderCurrencyAmountList(paid, language)} icon={ArrowUpRight} tone="error" />
        <AdminKpiCard label={t("admin.operations.stats.transferred")} value={renderCurrencyAmountList(transferred, language)} icon={ArrowLeftRight} tone="neutral" />
      </div>
      <Table toolbar={<TableToolbar><TableToolbar.Row justify="between"><span className="text-xs font-semibold text-light-muted dark:text-dark-muted">{t("admin.operations.table.count", { count: formatAdminNumber(rows.length, language) })}</span><div className="w-56"><SelectField options={kindOptions} value={kind} onValueChange={(value) => { setKind(value as OperationFilter); setPage(1); }} tone="light" clearable={false} /></div></TableToolbar.Row></TableToolbar>}>
        <TableHeader headerData={[
          { title: t("admin.operations.column.number") }, { title: t("admin.operations.column.date") }, { title: t("admin.operations.column.type") }, { title: t("admin.operations.column.partner") }, { title: t("admin.operations.column.from") }, { title: t("admin.operations.column.to") }, { title: t("admin.operations.column.document") }, { title: t("admin.operations.column.amount"), align: "end" },
        ]} />
        <TableBody>
          {rows.length === 0 ? <DataTableEmptyState colSpan={8} title={t("admin.operations.empty.title")} description={t("admin.operations.empty.description")} /> : rows.map((row) => (
            <TableRow key={`${row.kind}-${row.id}`}>
              <TableColumn><span className="font-mono text-xs font-semibold">{row.number}</span></TableColumn>
              <TableColumn>{new Date(row.date).toLocaleDateString(language === "en" ? "en-US" : language)}</TableColumn>
              <TableColumn>{kindLabel(row.kind)}</TableColumn>
              <TableColumn nowrap={false}>{row.partner ? `${row.partner.code} - ${row.partner.name}` : "-"}</TableColumn>
              <TableColumn nowrap={false}>{accountLabel(row.fromAccount)}</TableColumn>
              <TableColumn nowrap={false}>{accountLabel(row.toAccount)}</TableColumn>
              <TableColumn>{row.documentNumber ?? "-"}</TableColumn>
              <TableColumn className="text-end font-semibold">{renderCurrencyAmountList([{ currencyCode: row.currencyCode, amount: Number(row.amount) }], language)}</TableColumn>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {query.data?.pagination ? <Pagination meta={toPaginationMeta(query.data.pagination)!} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} disabled={query.isFetching} /> : null}
    </div>
  );
}

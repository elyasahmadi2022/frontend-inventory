"use client";

import { gooeyToast } from "goey-toast";
import { Banknote, Handshake, Landmark, ReceiptText, Store, UserRoundCog, Users, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminKpiCard } from "@/components/admin/dashboard/dashboard-panel";
import { AdminPartnersTable } from "@/components/admin/partners/admin-partners-table";
import { formatAdminNumber } from "@/components/admin/shared/admin-money-display";
import TableToolbar from "@/components/common/table-tool-bar";
import { toPaginationMeta } from "@/lib/admin/pagination-meta";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  useAdminAccountsQuery,
  useAdminPartnersQuery,
} from "@/lib/query/hooks";
import type { PartnerRow, PartnerType } from "@/services/partners.service";

type PartnerStatus = "all" | "active" | "inactive";
type PartnerTab = "all" | "customer" | "vendor" | "staff" | "sarafi";

function partnerMatchesTab(partner: PartnerRow, tab: PartnerTab) {
  if (tab === "all") return true;
  if (tab === "customer") return partner.type === "customer" || partner.type === "both";
  if (tab === "vendor") return partner.type === "vendor" || partner.type === "both";
  return partner.type === tab;
}

export function AdminPartnersContent() {
  const { language, t } = useI18n();
  const [tab, setTab] = useState<PartnerTab>("all");
  const [status, setStatus] = useState<PartnerStatus>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const partnerType: PartnerType | undefined = tab === "all" ? undefined : tab;
  const partnersQuery = useAdminPartnersQuery({
    page,
    limit: pageSize,
    type: partnerType,
    isActive:
      status === "active" ? true : status === "inactive" ? false : undefined,
  });
  const accountsQuery = useAdminAccountsQuery({ page: 1, limit: 100, isActive: true });

  useEffect(() => {
    const error = partnersQuery.error;
    if (!error) return;
    gooeyToast.error(t("admin.partners.toast.loadFailedTitle"), {
      description:
        error instanceof ApiError
          ? error.message
          : t("admin.partners.toast.loadFailedFallback"),
    });
  }, [partnersQuery.error, t]);

  useEffect(() => {
    if (!accountsQuery.error) return;
    gooeyToast.error(t("admin.partners.toast.accountsLoadFailedTitle"), {
      description:
        accountsQuery.error instanceof ApiError
          ? accountsQuery.error.message
          : t("admin.partners.toast.accountsLoadFailedFallback"),
    });
  }, [accountsQuery.error, t]);

  const allPartners = useMemo(
    () => partnersQuery.data?.items ?? [],
    [partnersQuery.data?.items],
  );
  const partners = useMemo(
    () => allPartners.filter((partner) => partnerMatchesTab(partner, tab)),
    [allPartners, tab],
  );
  const customers = useMemo(
    () => allPartners.filter((partner) => ["customer", "both"].includes(partner.type)).length,
    [allPartners],
  );
  const vendors = useMemo(
    () => allPartners.filter((partner) => ["vendor", "both"].includes(partner.type)).length,
    [allPartners],
  );
  const ledgers = allPartners.reduce(
    (sum, partner) => sum + (partner.ledgerAccounts?.length ?? 0),
    0,
  );
  const tabLedgers = partners.reduce(
    (sum, partner) => sum + (partner.ledgerAccounts?.length ?? 0),
    0,
  );
  const activeCount = partners.filter((partner) => partner.isActive).length;
  const tabStats = useMemo(() => {
    if (tab === "customer") {
      return [
        { label: t("admin.partners.stats.customerTotal"), value: partners.length, icon: Users, tone: "success" as const },
        { label: t("admin.partners.stats.customerReceivable"), value: tabLedgers, icon: Landmark, tone: "neutral" as const },
        { label: t("admin.partners.stats.customerSales"), value: "-", icon: ReceiptText, tone: "neutral" as const },
        { label: t("admin.partners.stats.customerOutstanding"), value: "-", icon: WalletCards, tone: "warning" as const },
      ];
    }
    if (tab === "vendor") {
      return [
        { label: t("admin.partners.stats.vendorTotal"), value: partners.length, icon: Store, tone: "neutral" as const },
        { label: t("admin.partners.stats.vendorPayable"), value: tabLedgers, icon: Landmark, tone: "neutral" as const },
        { label: t("admin.partners.stats.vendorPurchases"), value: "-", icon: ReceiptText, tone: "neutral" as const },
        { label: t("admin.partners.stats.vendorOutstanding"), value: "-", icon: WalletCards, tone: "warning" as const },
      ];
    }
    if (tab === "staff") {
      return [
        { label: t("admin.partners.stats.employeeTotal"), value: partners.length, icon: UserRoundCog, tone: "neutral" as const },
        { label: t("admin.partners.stats.employeeSalary"), value: "-", icon: WalletCards, tone: "warning" as const },
        { label: t("admin.partners.stats.employeeExpenses"), value: "-", icon: ReceiptText, tone: "neutral" as const },
        { label: t("admin.partners.stats.employeeActive"), value: activeCount, icon: Users, tone: "success" as const },
      ];
    }
    if (tab === "sarafi") {
      return [
        { label: t("admin.partners.stats.sarafiTotal"), value: partners.length, icon: Landmark, tone: "neutral" as const },
        { label: t("admin.partners.stats.sarafiBalance"), value: "-", icon: WalletCards, tone: "neutral" as const },
        { label: t("admin.partners.stats.sarafiVolume"), value: "-", icon: Banknote, tone: "neutral" as const },
        { label: t("admin.partners.stats.sarafiActive"), value: activeCount, icon: Users, tone: "success" as const },
      ];
    }
    return [
      { label: t("admin.partners.stats.partners"), value: allPartners.length, icon: Handshake, tone: "neutral" as const },
      { label: t("admin.partners.stats.customers"), value: customers, icon: Users, tone: "success" as const },
      { label: t("admin.partners.stats.vendors"), value: vendors, icon: Store, tone: "neutral" as const },
      { label: t("admin.partners.stats.ledgers"), value: ledgers, icon: Landmark, tone: "neutral" as const },
    ];
  }, [activeCount, allPartners.length, customers, ledgers, partners.length, tab, tabLedgers, t, vendors]);
  const tabs = useMemo(
    () => [
      { id: "all", label: t("admin.partners.tabs.all"), icon: <Handshake className="size-4" /> },
      { id: "customer", label: t("admin.partners.tabs.customers"), icon: <Users className="size-4" /> },
      { id: "vendor", label: t("admin.partners.tabs.vendors"), icon: <Store className="size-4" /> },
      { id: "staff", label: t("admin.partners.tabs.employees"), icon: <UserRoundCog className="size-4" /> },
      { id: "sarafi", label: t("admin.partners.tabs.sarafi"), icon: <Landmark className="size-4" /> },
    ],
    [t],
  );

  return (
    <div className="space-y-1">
      <AdminPageHeader
        eyebrow={t("admin.partners.eyebrow")}
        title={t("admin.partners.title")}
        description={t("admin.partners.description")}
      />
      <div className="space-y-1">
        <div className="grid gap-1 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {tabStats.map((stat,index) => (
            <AdminKpiCard
              key={index}
              label={stat.label}
              value={typeof stat.value === "number" ? formatAdminNumber(stat.value, language) : stat.value}
              icon={stat.icon}
              tone={stat.tone}
            />
          ))}
        </div>
        <TableToolbar.ViewTabs
          tabs={tabs}
          value={tab}
          onValueChange={(value) => {
            setTab(value as PartnerTab);
            setPage(1);
          }}
        />
        <AdminPartnersTable
          accounts={accountsQuery.data ?? []}
          items={partners}
          loading={partnersQuery.isLoading}
          pagination={toPaginationMeta(partnersQuery.data?.pagination)}
          refreshing={partnersQuery.isFetching || accountsQuery.isFetching}
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
            void partnersQuery.refetch();
            void accountsQuery.refetch();
          }}
        />
      </div>
    </div>
  );
}

"use client";

import { ReceiptText, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { AdminPurchasesContent } from "@/components/admin/purchases/admin-purchases-content";
import { AdminSalesContent } from "@/components/admin/sales/admin-sales-content";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import TableToolbar, {
  type TableViewTab,
} from "@/components/common/table-tool-bar";
import { useI18n } from "@/lib/i18n";

type TradeTab = "sales" | "purchases";

type AdminTradeContentProps = {
  initialTab?: TradeTab;
};

export function AdminTradeContent({
  initialTab = "sales",
}: AdminTradeContentProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<TradeTab>(initialTab);
  const tabs: TableViewTab[] = [
    {
      id: "sales",
      label: t("admin.nav.sales"),
      icon: <ShoppingCart />,
    },
    {
      id: "purchases",
      label: t("admin.nav.purchases"),
      icon: <ReceiptText />,
    },
  ];

  return (
    <div className="space-y-1">
      <AdminPageHeader
        eyebrow={t("admin.trade.eyebrow")}
        title={t("admin.nav.salesAndPurchases")}
        description={t("admin.trade.description")}
      />
      <section
        className="border border-light-border bg-light-surface p-2 shadow-xs dark:border-dark-border dark:bg-dark-surface dark:shadow-dark-xs sm:p-3"
        aria-label={t("admin.trade.workspace")}
      >
        <p className="px-1 pb-2 text-sm font-semibold text-light-text dark:text-dark-text">
          {t("admin.trade.workspace")}
        </p>
        <TableToolbar.ViewTabs
          tabs={tabs}
          value={tab}
          className="gap-2 p-1.5"
          tabClassName="min-h-12 flex-1 gap-2 px-5 text-sm"
          onValueChange={(value) => setTab(value as TradeTab)}
        />
      </section>
      {tab === "sales" ? (
        <AdminSalesContent showHeader={false} />
      ) : (
        <AdminPurchasesContent showHeader={false} />
      )}
    </div>
  );
}

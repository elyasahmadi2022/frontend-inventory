"use client";

import { AdminPartnerDetailsContent } from "@/app/(admin)/admin/partners/[id]/partner-details-client";
import {
  AdminDetailPageSkeleton,
  AdminRecordNotFound,
} from "@/components/admin/admin-detail-layout";
import { useI18n } from "@/lib/i18n";
import { useAdminPurchaseQuery, useAdminSaleQuery } from "@/lib/query/hooks";

type Props = {
  kind: "sale" | "purchase";
  number: string;
};

export function AdminTradePartnerDetails({ kind, number }: Props) {
  const { t } = useI18n();
  const saleQuery = useAdminSaleQuery(kind === "sale" ? number : "");
  const purchaseQuery = useAdminPurchaseQuery(
    kind === "purchase" ? number : "",
  );
  const sale = saleQuery.data;
  const purchase = purchaseQuery.data;
  const document = kind === "sale" ? sale : purchase;
  const loading =
    kind === "sale" ? saleQuery.isLoading : purchaseQuery.isLoading;
  const partnerId = kind === "sale" ? sale?.customerId : purchase?.vendorId;

  if (loading) return <AdminDetailPageSkeleton />;

  if (!document || !partnerId) {
    return (
      <AdminRecordNotFound
        backHref={kind === "sale" ? "/admin/sales" : "/admin/purchases"}
        backLabel={
          kind === "sale"
            ? t("admin.sales.details.back")
            : t("admin.purchase.details.back")
        }
        message={
          kind === "sale"
            ? t("admin.sales.toast.loadFailedFallback")
            : t("admin.purchases.toast.loadFailedFallback")
        }
      />
    );
  }

  return (
    <AdminPartnerDetailsContent
      partnerId={partnerId}
      backHref={kind === "sale" ? "/admin/sales" : "/admin/purchases"}
      backLabel={
        kind === "sale"
          ? t("admin.sales.details.back")
          : t("admin.purchase.details.back")
      }
      collapsibleTransactionHistory
    />
  );
}

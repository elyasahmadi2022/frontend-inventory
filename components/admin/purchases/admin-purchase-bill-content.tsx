"use client";

import { gooeyToast } from "goey-toast";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPrintableInvoice } from "@/components/admin/shared/admin-printable-invoice";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAdminPurchaseQuery } from "@/lib/query/hooks";
import { appRoutes } from "@/routes/app-routes";

type Props = {
  number: string;
};

export function AdminPurchaseBillContent({ number }: Props) {
  const { t } = useI18n();
  const purchaseQuery = useAdminPurchaseQuery(number);
  const purchase = purchaseQuery.data;

  useEffect(() => {
    if (!purchaseQuery.error) return;
    gooeyToast.error(t("admin.purchases.toast.loadFailedTitle"), {
      description:
        purchaseQuery.error instanceof ApiError
          ? purchaseQuery.error.message
          : t("admin.purchases.toast.loadFailedFallback"),
    });
  }, [purchaseQuery.error, t]);

  return (
    <div className="space-y-3">
      <Link
        href={appRoutes.adminPurchases}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 transition hover:underline dark:text-primary-500 print:hidden"
      >
        <ArrowLeft className="size-4" />
        {t("admin.purchase.details.back")}
      </Link>
      <div className="print:hidden">
        <AdminPageHeader
          eyebrow={t("admin.purchases.eyebrow")}
          title={`${t("admin.purchases.actions.bill")} ${number}`}
          description={purchase?.vendor?.name ?? t("admin.purchases.description")}
        />
      </div>
      {purchase ? <AdminPrintableInvoice kind="purchase" document={purchase} /> : null}
    </div>
  );
}

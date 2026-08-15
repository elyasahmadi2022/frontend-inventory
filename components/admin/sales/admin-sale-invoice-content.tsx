"use client";

import { gooeyToast } from "goey-toast";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPrintableInvoice } from "@/components/admin/shared/admin-printable-invoice";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAdminSaleQuery } from "@/lib/query/hooks";
import { appRoutes } from "@/routes/app-routes";

type Props = {
  number: string;
};

export function AdminSaleInvoiceContent({ number }: Props) {
  const { t } = useI18n();
  const saleQuery = useAdminSaleQuery(number);
  const sale = saleQuery.data;

  useEffect(() => {
    if (!saleQuery.error) return;
    gooeyToast.error(t("admin.sales.toast.loadFailedTitle"), {
      description:
        saleQuery.error instanceof ApiError
          ? saleQuery.error.message
          : t("admin.sales.toast.loadFailedFallback"),
    });
  }, [saleQuery.error, t]);

  return (
    <div className="space-y-3">
      <Link
        href={appRoutes.adminSales}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 transition hover:underline dark:text-primary-500 print:hidden"
      >
        <ArrowLeft className="size-4" />
        {t("admin.sales.details.back")}
      </Link>
      <div className="print:hidden">
        <AdminPageHeader
          eyebrow={t("admin.sales.eyebrow")}
          title={`${t("admin.sales.actions.invoice")} ${number}`}
          description={sale?.customer?.name ?? t("admin.sales.description")}
        />
      </div>
      {sale ? <AdminPrintableInvoice kind="sale" document={sale} /> : null}
    </div>
  );
}

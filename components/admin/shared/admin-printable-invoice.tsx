"use client";

import { Printer } from "lucide-react";
import Image from "next/image";
import { resolveUploadAssetUrl } from "@/lib/asset-url";
import { useI18n } from "@/lib/i18n";
import { useStoreSettingsQuery } from "@/lib/query/hooks";
import type {
  PurchaseLineRow,
  PurchaseRow,
} from "@/services/purchases.service";
import type { SaleLineRow, SaleRow } from "@/services/sales.service";

type Props =
  | { kind: "sale"; document: SaleRow; showPrintButton?: boolean }
  | { kind: "purchase"; document: PurchaseRow; showPrintButton?: boolean };

function money(
  value: string | number | undefined,
  currency: string | undefined,
  locale: string,
) {
  return `${Number(value ?? 0).toLocaleString(locale)} ${currency ?? ""}`.trim();
}

function dateLabel(value: string | null | undefined, locale: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString(locale);
}

export function AdminPrintableInvoice({
  kind,
  document,
  showPrintButton = true,
}: Props) {
  const { t, direction, language } = useI18n();
  const locale =
    language === "en" ? "en-US" : language === "fa" ? "fa-IR" : "ps-AF";
  const settingsQuery = useStoreSettingsQuery();
  const settings = settingsQuery.data;
  const isSale = kind === "sale";
  const partner = isSale
    ? (document as SaleRow).customer
    : (document as PurchaseRow).vendor;
  const documentDate = isSale
    ? (document as SaleRow).invoiceDate
    : (document as PurchaseRow).billDate;
  const pastDue = Math.max(
    Number(document.total) - Number(document.paidTotal),
    0,
  );
  const lines = document.lines ?? [];
  const logoUrl = resolveUploadAssetUrl(settings?.logoUrl, "other");
  const documentTitle = isSale
    ? t("admin.invoice.saleTitle")
    : t("admin.invoice.purchaseTitle");
  const accentColor = "#075985";
  const template = {
    showLogo: true,
    showContact: true,
    showNotes: true,
    showSignature: true,
  };

  return (
    <div className="space-y-2 bg-light-surface">
      <style>{`@media print { @page { size: A5 portrait; margin: 8mm; } }`}</style>
      {showPrintButton ? (
        <div className="mb-2 flex justify-end print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Printer className="size-4" />
            {isSale
              ? t("admin.sales.invoice.print")
              : t("admin.purchases.invoice.print")}
          </button>
        </div>
      ) : null}
      <div className="overflow-x-auto pb-2">
        <article
          dir={direction}
          className="admin-print-document relative mx-auto w-full max-w-[680px] overflow-hidden border border-slate-200 bg-white text-slate-900 shadow-lg print:max-w-none print:border-0 print:shadow-none"
        >
          <div className="h-2" style={{ backgroundColor: accentColor }} />
          <div className="space-y-5 p-5 sm:p-6 print:p-4">
            <header className="grid gap-5 border-b-2 border-slate-900 pb-5 sm:grid-cols-[1fr_auto]">
              <div className="flex items-start gap-4">
                {template.showLogo ? (
                  logoUrl ? (
                    <span className="relative size-16 shrink-0 overflow-hidden border border-slate-200 bg-white">
                      <Image
                        src={logoUrl}
                        alt=""
                        fill
                        unoptimized
                        className="object-contain p-1"
                      />
                    </span>
                  ) : (
                    <span
                      style={{ backgroundColor: accentColor }}
                      className="flex size-14 shrink-0 items-center justify-center text-xl font-black text-white"
                    >
                      {(settings?.storeName ?? "S")
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )
                ) : null}
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                    {settings?.storeName ?? "Store"}
                  </h1>
                  {template.showContact ? (
                    <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
                      {[settings?.address, settings?.city, settings?.country]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </p>
                  ) : null}
                  {template.showContact ? (
                    <p className="mt-0.5 text-xs text-slate-500">
                      {[settings?.phone, settings?.email, settings?.website]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="sm:text-end">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-700">
                  {documentTitle}
                </p>
                <p className="mt-1 font-mono text-xl font-black text-slate-950">
                  {document.number}
                </p>
                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-900">
                      {isSale
                        ? t("admin.sales.invoice.date")
                        : t("admin.purchases.invoice.date")}
                      :
                    </span>{" "}
                    {dateLabel(documentDate, locale)}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">
                      {t("admin.invoice.dueDate")}:
                    </span>{" "}
                    {dateLabel(document.dueDate, locale)}
                  </p>
                </div>
              </div>
            </header>

            <section className="grid gap-3 sm:grid-cols-2">
              <div
                style={{ borderInlineStartColor: accentColor }}
                className="border-s-4 bg-slate-50 p-4"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                  {isSale
                    ? t("admin.sales.invoice.to")
                    : t("admin.purchases.invoice.to")}
                </p>
                <p className="mt-1 text-base font-bold">
                  {partner?.name ?? "-"}
                </p>
                <p className="text-xs text-slate-500">{partner?.code}</p>
              </div>
              <div className="border border-slate-200 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                  {isSale
                    ? t("admin.sales.invoice.phone")
                    : t("admin.purchases.invoice.phone")}
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {partner?.phone || "-"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {partner?.address || "-"}
                </p>
              </div>
            </section>

            <div className="overflow-hidden border border-slate-200">
              <table className="w-full border-collapse text-xs sm:text-sm">
                <thead>
                  <tr
                    style={{ backgroundColor: accentColor }}
                    className="text-white"
                  >
                    <th className="px-3 py-2.5 text-start">
                      {isSale
                        ? t("admin.sales.invoice.lineNo")
                        : t("admin.purchases.invoice.lineNo")}
                    </th>
                    <th className="px-3 py-2.5 text-start">
                      {isSale
                        ? t("admin.sales.invoice.description")
                        : t("admin.purchases.invoice.description")}
                    </th>
                    <th className="px-3 py-2.5 text-end">
                      {isSale
                        ? t("admin.sales.invoice.quantity")
                        : t("admin.purchases.invoice.quantity")}
                    </th>
                    <th className="px-3 py-2.5 text-end">
                      {isSale
                        ? t("admin.sales.invoice.unitPrice")
                        : t("admin.purchases.invoice.unitCost")}
                    </th>
                    <th className="px-3 py-2.5 text-end">
                      {isSale
                        ? t("admin.sales.invoice.lineTotal")
                        : t("admin.purchases.invoice.lineTotal")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => {
                    const saleLine = line as SaleLineRow;
                    const purchaseLine = line as PurchaseLineRow;
                    const unitValue = isSale
                      ? Number(saleLine.unitPrice ?? 0)
                      : Number(purchaseLine.unitCost ?? 0);
                    const description =
                      line.description ||
                      (line.product
                        ? `${line.product.sku} - ${line.product.name}`
                        : "-");
                    return (
                      <tr
                        key={line.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                      >
                        <td className="border-b border-slate-200 px-3 py-2.5 text-slate-500">
                          {index + 1}
                        </td>
                        <td className="border-b border-slate-200 px-3 py-2.5 font-medium">
                          {description}
                        </td>
                        <td className="border-b border-slate-200 px-3 py-2.5 text-end">
                          {Number(line.quantity)}{" "}
                          {line.product?.baseUnit?.name ??
                            line.product?.baseUnit?.code ??
                            (isSale
                              ? t("admin.sales.invoice.unit")
                              : t("admin.purchases.invoice.unit"))}
                        </td>
                        <td className="border-b border-slate-200 px-3 py-2.5 text-end">
                          {money(unitValue, document.currencyCode, locale)}
                        </td>
                        <td className="border-b border-slate-200 px-3 py-2.5 text-end font-bold">
                          {money(line.lineTotal, document.currencyCode, locale)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <section className="grid gap-4 sm:grid-cols-[1fr_14rem]">
              <div className="text-xs leading-relaxed text-slate-500">
                {template.showNotes &&
                (document.notes || settings?.invoiceNote) ? (
                  <>
                    <p className="mb-1 font-bold uppercase tracking-wider text-slate-700">
                      {t("admin.invoice.notes")}
                    </p>
                    <p>{document.notes || settings?.invoiceNote}</p>
                  </>
                ) : null}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between border-b border-slate-200 py-1">
                  <span>
                    {isSale
                      ? t("admin.sales.invoice.subTotal")
                      : t("admin.purchases.invoice.subTotal")}
                  </span>
                  <span>
                    {money(document.subtotal, document.currencyCode, locale)}
                  </span>
                </div>
                {Number(document.discountTotal) !== 0 ? (
                  <div className="flex justify-between border-b border-slate-200 py-1">
                    <span>{t("admin.invoice.discount")}</span>
                    <span>
                      -
                      {money(
                        document.discountTotal,
                        document.currencyCode,
                        locale,
                      )}
                    </span>
                  </div>
                ) : null}
                {Number(document.taxTotal) !== 0 ? (
                  <div className="flex justify-between border-b border-slate-200 py-1">
                    <span>{t("admin.invoice.tax")}</span>
                    <span>
                      {money(document.taxTotal, document.currencyCode, locale)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between border-b border-slate-200 py-1">
                  <span>{t("admin.invoice.paid")}</span>
                  <span>
                    {money(document.paidTotal, document.currencyCode, locale)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 py-1">
                  <span>{t("admin.invoice.balance")}</span>
                  <span>{money(pastDue, document.currencyCode, locale)}</span>
                </div>
                <div
                  style={{ backgroundColor: accentColor }}
                  className="mt-2 flex justify-between px-3 py-3 font-bold text-white"
                >
                  <span>
                    {isSale
                      ? t("admin.sales.invoice.grandTotal")
                      : t("admin.purchases.invoice.grandTotal")}
                  </span>
                  <span>
                    {money(document.total, document.currencyCode, locale)}
                  </span>
                </div>
              </div>
            </section>

            <footer className="flex items-end justify-between gap-4 border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold text-sky-800">
                {isSale
                  ? t("admin.sales.invoice.thanks")
                  : t("admin.purchases.invoice.thanks")}
              </p>
              {template.showSignature ? (
                <div className="min-w-40 border-t border-slate-400 pt-2 text-center text-xs text-slate-500">
                  {t("admin.invoice.signature")}
                </div>
              ) : null}
            </footer>
          </div>
        </article>
      </div>
    </div>
  );
}

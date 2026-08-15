"use client";

import { gooeyToast } from "goey-toast";
import { Boxes, FolderTree, MapPin, Package, Ruler } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminKpiCard } from "@/components/admin/dashboard/dashboard-panel";
import { AdminInventoryLocationsTable } from "@/components/admin/products/admin-inventory-locations-table";
import { AdminInventoryStockTable } from "@/components/admin/products/admin-inventory-stock-table";
import { AdminProductCategoriesTable } from "@/components/admin/products/admin-product-categories-table";
import { AdminProductsTable } from "@/components/admin/products/admin-products-table";
import { AdminProductUnitsTable } from "@/components/admin/products/admin-product-units-table";
import TableToolbar from "@/components/common/table-tool-bar";
import { toPaginationMeta } from "@/lib/admin/pagination-meta";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  useAdminInventoryLocationsQuery,
  useAdminInventoryBalancesQuery,
  useAdminProductCategoriesQuery,
  useAdminProductsQuery,
  useAdminProductUnitsQuery,
} from "@/lib/query/hooks";

type ProductTab = "products" | "stock" | "categories" | "locations" | "units";

export function AdminProductsContent() {
  const { t } = useI18n();
  const [tab, setTab] = useState<ProductTab>("products");
  const [stockLocationId, setStockLocationId] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const productsQuery = useAdminProductsQuery({ page, limit: pageSize });
  const categoriesQuery = useAdminProductCategoriesQuery();
  const unitsQuery = useAdminProductUnitsQuery();
  const locationsQuery = useAdminInventoryLocationsQuery();
  const inventoryBalancesQuery = useAdminInventoryBalancesQuery();

  useEffect(() => {
    const error =
      productsQuery.error ??
      categoriesQuery.error ??
      unitsQuery.error ??
      locationsQuery.error ??
      inventoryBalancesQuery.error;
    if (!error) return;
    gooeyToast.error(t("admin.products.toast.loadFailedTitle"), {
      description:
        error instanceof ApiError
          ? error.message
          : t("admin.products.toast.loadFailedFallback"),
    });
  }, [
    categoriesQuery.error,
    locationsQuery.error,
    inventoryBalancesQuery.error,
    productsQuery.error,
    t,
    unitsQuery.error,
  ]);

  const products = productsQuery.data?.items ?? [];
  const categories = categoriesQuery.data ?? [];
  const units = unitsQuery.data ?? [];
  const locations = locationsQuery.data ?? [];
  const activeProducts = products.filter((product) => product.isActive).length;
  const lowStockProducts = products.filter(
    (product) =>
      product.reorderLevel &&
      (product.inventoryBalances ?? []).reduce(
        (sum, balance) => sum + Number(balance.quantityOnHand ?? 0),
        0,
      ) <= Number(product.reorderLevel),
  ).length;

  const tabs = useMemo(
    () => [
      {
        id: "products",
        label: t("admin.products.tabs.products"),
        icon: <Package className="size-4" />,
      },
      {
        id: "categories",
        label: t("admin.products.tabs.categories"),
        icon: <FolderTree className="size-4" />,
      },
      {
        id: "units",
        label: t("admin.products.tabs.units"),
        icon: <Ruler className="size-4" />,
      },
      {
        id: "stock",
        label: t("admin.products.tabs.stock"),
        icon: <Boxes className="size-4" />,
      },
      {
        id: "locations",
        label: t("admin.products.tabs.locations"),
        icon: <MapPin className="size-4" />,
      },
    ],
    [t],
  );

  return (
    <div className="space-y-1">
      <AdminPageHeader
        eyebrow={t("admin.products.eyebrow")}
        title={t("admin.products.title")}
        description={t("admin.products.description")}
      />
      <div className="space-y-1">
        <div className="grid gap-1  grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <AdminKpiCard
            label={t("admin.products.stats.products")}
            value={products.length}
            icon={Package}
            tone="neutral"
          />
          <AdminKpiCard
            label={t("admin.products.stats.active")}
            value={activeProducts}
            icon={Package}
            tone="success"
          />
          <AdminKpiCard
            label={t("admin.products.stats.categories")}
            value={categories.length}
            icon={FolderTree}
            tone="neutral"
          />
          <AdminKpiCard
            label={t("admin.products.stats.lowStock")}
            value={lowStockProducts}
            icon={Boxes}
            tone={lowStockProducts > 0 ? "warning" : "neutral"}
          />
        </div>

        <TableToolbar.ViewTabs
          tabs={tabs}
          value={tab}
          onValueChange={(value) => {
            setTab(value as ProductTab);
            if (value !== "stock") setStockLocationId(undefined);
          }}
        />

        {tab === "products" ? (
          <AdminProductsTable
            items={products}
            categories={categories}
            units={units}
            pagination={toPaginationMeta(productsQuery.data?.pagination)}
            loading={
              productsQuery.isLoading ||
              categoriesQuery.isLoading ||
              unitsQuery.isLoading
            }
            refreshing={
              productsQuery.isFetching ||
              categoriesQuery.isFetching ||
              unitsQuery.isFetching
            }
            onRefresh={() => {
              void productsQuery.refetch();
              void categoriesQuery.refetch();
              void unitsQuery.refetch();
            }}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            }}
          />
        ) : null}

        {tab === "categories" ? (
          <AdminProductCategoriesTable
            items={categories}
            loading={categoriesQuery.isLoading}
          />
        ) : null}

        {tab === "units" ? (
          <AdminProductUnitsTable
            onUnitsChanged={() => {
              void unitsQuery.refetch();
            }}
          />
        ) : null}

        {tab === "stock" ? (
          <AdminInventoryStockTable
            balances={inventoryBalancesQuery.data ?? []}
            products={products}
            locations={locations}
            locationFilterId={stockLocationId}
            loading={
              inventoryBalancesQuery.isLoading ||
              productsQuery.isLoading ||
              locationsQuery.isLoading
            }
            refreshing={
              inventoryBalancesQuery.isFetching ||
              productsQuery.isFetching ||
              locationsQuery.isFetching
            }
            onRefresh={() => {
              void inventoryBalancesQuery.refetch();
              void productsQuery.refetch();
              void locationsQuery.refetch();
            }}
          />
        ) : null}

        {tab === "locations" ? (
          <AdminInventoryLocationsTable
            items={locations}
            loading={locationsQuery.isLoading}
            onViewStock={(locationId) => {
              setStockLocationId(locationId);
              setTab("stock");
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

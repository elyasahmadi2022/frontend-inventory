import { withAdminDetailSuspense } from "@/components/admin/admin-detail-page-shell";
import { AdminInventoryDetailsContent } from "./inventory-details-client";

type PageProps = {
  params: Promise<{ productId: string; locationId: string }>;
};

export default async function AdminInventoryDetailsPage({ params }: PageProps) {
  const { productId, locationId } = await params;
  return withAdminDetailSuspense(
    <AdminInventoryDetailsContent productId={productId} locationId={locationId} />,
  );
}

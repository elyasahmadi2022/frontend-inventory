import { withAdminDetailSuspense } from "@/components/admin/admin-detail-page-shell";
import { AdminPartnerDetailsContent } from "./partner-details-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminPartnerDetailsPage({ params }: PageProps) {
  const { id } = await params;
  return withAdminDetailSuspense(<AdminPartnerDetailsContent partnerId={id} />);
}

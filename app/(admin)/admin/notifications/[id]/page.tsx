import { StoreModulePage } from "@/components/layout/store-module-page";

type AdminNotificationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminNotificationDetailPage({
  params,
}: AdminNotificationDetailPageProps) {
  const { id } = await params;

  return (
    <StoreModulePage
      title={`Notification ${id}`}
      description="Notification details will connect to the backend notification API."
      items={[
        "Notification message",
        "Read and unread status",
        "Related user or store operation",
      ]}
    />
  );
}

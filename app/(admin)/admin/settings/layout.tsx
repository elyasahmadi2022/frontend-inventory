import { AdminSettingsShell } from "@/components/admin/settings/admin-settings-shell";

export default function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <AdminSettingsShell>{children}</AdminSettingsShell>
    </div>
  );
}

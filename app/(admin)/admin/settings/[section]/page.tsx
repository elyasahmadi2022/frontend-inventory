import { notFound } from "next/navigation";
import { AdminSettingsProfileContent } from "@/components/admin/settings/admin-settings-profile-content";
import { AdminSettingsSectionContent } from "@/components/admin/settings/admin-settings-section-content";
import { AdminSettingsSecurityContent } from "@/components/admin/settings/admin-settings-security-content";
import { AdminUsersContent } from "@/components/admin/users/admin-users-content";
import { isAdminSettingsSectionId } from "@/lib/admin/admin-settings-catalog";

type AdminSettingsSectionPageProps = {
  params: Promise<{ section: string }>;
};

export default async function AdminSettingsSectionPage({
  params,
}: AdminSettingsSectionPageProps) {
  const { section } = await params;

  if (!isAdminSettingsSectionId(section)) {
    notFound();
  }

  if (section === "security") {
    return <AdminSettingsSecurityContent />;
  }

  if (section === "profile") {
    return <AdminSettingsProfileContent />;
  }

  if (section === "users") {
    return <AdminUsersContent />;
  }

  return <AdminSettingsSectionContent sectionId={section} />;
}

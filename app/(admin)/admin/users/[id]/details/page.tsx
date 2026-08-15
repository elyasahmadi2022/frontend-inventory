import { redirect } from "next/navigation";
import { appRoutes } from "@/routes/app-routes";

export default async function AdminUserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(appRoutes.adminUserDetails(id));
}

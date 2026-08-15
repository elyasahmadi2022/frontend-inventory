import { redirect } from "next/navigation";
import { appRoutes } from "@/routes/app-routes";

export default function AdminUsersPage() {
  redirect(appRoutes.adminSettingsUsers);
}

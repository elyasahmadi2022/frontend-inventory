import { redirect } from "next/navigation";
import { appRoutes } from "@/routes/app-routes";

export default function AdminIndexPage() {
  redirect(appRoutes.adminDashboard);
}

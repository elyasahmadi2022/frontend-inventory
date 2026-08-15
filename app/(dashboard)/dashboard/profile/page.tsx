import { redirect } from "next/navigation";
import { appRoutes } from "@/routes/app-routes";

export default function ProfilePage() {
  redirect(appRoutes.dashboardSettings);
}

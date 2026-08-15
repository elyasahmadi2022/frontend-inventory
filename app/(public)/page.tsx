import { appRoutes } from "@/routes/app-routes";
import { redirect } from "next/navigation";

export default function  App(){
    redirect(appRoutes.dashboard)
}
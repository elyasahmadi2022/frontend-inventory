"use client";

import Link from "next/link";
import { useEmailVerificationStatusQuery } from "@/lib/query/hooks";
import { appRoutes } from "@/routes/app-routes";

export function DashboardEmailVerificationBanner() {
  const { data: status } = useEmailVerificationStatusQuery();

  if (!status?.pending || status.isEmailVerified) {
    return null;
  }

  return (
    <div className="border border-amber-400/30 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Email verification required</p>
          <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">
            {status.message ??
              "Please verify your account. Unverified accounts may be suspended or closed."}
          </p>
        </div>
        <Link
          href={appRoutes.dashboardVerifyEmail}
          className="inline-flex shrink-0 items-center justify-center border border-amber-500/40 bg-amber-500 px-4 py-2 text-xs font-semibold text-black transition hover:bg-amber-400"
        >
          Verify now
        </Link>
      </div>
    </div>
  );
}

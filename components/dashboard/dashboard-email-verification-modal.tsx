"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useAuth } from "@/hooks/use-auth";
import { useEmailVerificationStatusQuery } from "@/lib/query/hooks";
import { appRoutes } from "@/routes/app-routes";

const DISMISS_KEY = "luilal-email-verify-prompt-dismissed";

export function DashboardEmailVerificationModal() {
  const pathname = usePathname();
  const { status } = useAuth();
  const { data: verificationStatus } = useEmailVerificationStatusQuery(
    status === "authenticated",
  );
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  const onVerifyPage = pathname?.startsWith(appRoutes.dashboardVerifyEmail);
  const shouldShow =
    status === "authenticated" &&
    verificationStatus?.pending &&
    !verificationStatus.isEmailVerified &&
    !onVerifyPage &&
    !dismissed;

  useEffect(() => {
    if (!shouldShow) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [shouldShow]);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  if (!shouldShow || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50 dark:bg-black/60"
        onClick={handleDismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-verify-prompt-title"
        className="relative w-full max-w-md border border-light-border bg-light-surface p-6 shadow-xl dark:border-dark-border dark:bg-dark-surface"
      >
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute end-3 top-3 inline-flex h-8 w-8 items-center justify-center text-muted transition hover:text-light-text dark:hover:text-dark-text"
          aria-label="Close"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 pe-6">
            <h2
              id="email-verify-prompt-title"
              className="text-lg font-semibold text-light-text dark:text-dark-text"
            >
              Please verify your account
            </h2>
            <p className="mt-2 text-sm text-muted">
              {verificationStatus?.message ??
                "Verify your email to keep your account active. Unverified accounts may be suspended or closed."}
            </p>
            <p className="mt-3 text-sm text-muted">
              Open the verification page and request a code to your email when
              you are ready.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex min-h-10 items-center justify-center border border-light-border bg-light-bg px-4 py-2 text-sm font-semibold text-light-text transition hover:border-primary-500 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text"
          >
            Remind me later
          </button>
          <Link
            href={appRoutes.dashboardVerifyEmail}
            onClick={handleDismiss}
            className="inline-flex min-h-10 items-center justify-center border border-primary-500/30 bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500"
          >
            Verify now
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}

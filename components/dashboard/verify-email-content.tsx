"use client";
import { gooeyToast } from "goey-toast";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { InputField } from "@/components/common/input-field";
import { LoaderMini } from "@/components/common/loader-mini";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import {
  useEmailVerificationStatusQuery,
  useRequestEmailVerificationOtpMutation,
  useVerifyEmailOtpMutation,
} from "@/lib/query/hooks";
import { appRoutes } from "@/routes/app-routes";

export function VerifyEmailContent() {
  const router = useRouter();
  const { user, status, refreshUser } = useAuth();
  const [code, setCode] = useState("");

  const authenticated = status === "authenticated";

  const {
    data: verificationStatus,
    isLoading,
    isError,
    error,
  } = useEmailVerificationStatusQuery(authenticated);

  const requestOtp = useRequestEmailVerificationOtpMutation();
  const verifyOtp = useVerifyEmailOtpMutation();

  useEffect(() => {
    if (!isError) return;
    gooeyToast.error("Verification", {
        description: error instanceof ApiError
          ? error.message
          : "Could not load verification status.",
      })
  }, [error, isError]);

  const handleRequestCode = async () => {
    try {
      await requestOtp.mutateAsync();
      gooeyToast.success("Code sent", {
        description: `Check ${user?.email ?? "your email"} for a 6-digit code.`,
      })
    } catch (requestError) {
      gooeyToast.error("Could not send code", {
        description: requestError instanceof ApiError ? requestError.message : "Please try again.",
      })
    }
  };

  const handleVerify = async () => {
    const normalized = code.replace(/\D/g, "").slice(0, 6);
    if (normalized.length !== 6) {
      gooeyToast.error("Verification code", {
        description: "Enter the 6-digit code from your email.",
      })
      return;
    }

    try {
      await verifyOtp.mutateAsync(normalized);
      await refreshUser();
      gooeyToast.success("Email verified", {
        description: "Your account email is now verified.",
      })
      router.replace(appRoutes.dashboard);
    } catch (verifyError) {
      gooeyToast.error("Verification failed", {
        description: verifyError instanceof ApiError ? verifyError.message : "Please try again.",
      })
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="mx-auto max-w-lg border border-light-border bg-light-surface p-6 dark:border-dark-border dark:bg-dark-surface">
        <div className="h-6 w-40 animate-pulse bg-light-border dark:bg-dark-border" />
        <div className="mt-4 h-24 animate-pulse bg-light-border dark:bg-dark-border" />
      </div>
    );
  }

  if (verificationStatus?.isEmailVerified || user?.isEmailVerified) {
    return (
      <div className="mx-auto max-w-lg border border-emerald-400/30 bg-emerald-50 p-6 text-sm text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200">
        <p className="font-semibold">Your email is already verified.</p>
        <Link
          href={appRoutes.dashboard}
          className="mt-3 inline-flex text-sm font-semibold text-primary-600 hover:underline dark:text-primary-500"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!verificationStatus?.pending) {
    return (
      <div className="mx-auto max-w-lg border border-amber-400/30 bg-amber-50 p-6 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
        <p className="font-semibold">No active verification request</p>
        <p className="mt-2">
          An admin needs to ask you to verify before you can complete email
          verification here.
        </p>
        <Link
          href={appRoutes.dashboard}
          className="mt-4 inline-flex text-sm font-semibold text-primary-600 hover:underline dark:text-primary-500"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg border border-light-border bg-light-surface p-6 dark:border-dark-border dark:bg-dark-surface sm:p-8">
      <h1 className="text-xl font-semibold text-light-text dark:text-dark-text">
        Verify your email
      </h1>
      <p className="mt-2 text-sm text-muted">
        {verificationStatus.otpSent
          ? `Enter the 6-digit code we sent to ${user?.email ?? "your email"}.`
          : `Request a verification code for ${user?.email ?? "your email"}, then enter it below.`}
      </p>

      {verificationStatus.message ? (
        <div className="mt-4 border border-amber-400/30 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800/80 dark:text-amber-200/80">
            Important
          </p>
          <p className="mt-2">{verificationStatus.message}</p>
        </div>
      ) : null}

      {!verificationStatus.otpSent ? (
        <button
          type="button"
          onClick={() => void handleRequestCode()}
          disabled={requestOtp.isPending}
          className="mt-6 inline-flex min-h-10 w-full items-center justify-center gap-2 border border-primary-500/30 bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 disabled:opacity-60"
        >
          {requestOtp.isPending ? (
            <>
              <LoaderMini size={16} color="currentColor" />
              <span>Sending code</span>
            </>
          ) : (
            "Send verification code to my email"
          )}
        </button>
      ) : (
        <>
          <div className="mt-6">
            <InputField
              id="verify-email-code"
              label="Verification code"
              tone="light"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="123456"
              maxLength={6}
            />
          </div>

          <button
            type="button"
            onClick={() => void handleVerify()}
            disabled={verifyOtp.isPending}
            className="mt-6 inline-flex min-h-10 w-full items-center justify-center gap-2 border border-primary-500/30 bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 disabled:opacity-60"
          >
            {verifyOtp.isPending ? (
              <>
                <LoaderMini size={16} color="currentColor" />
                <span>Verifying</span>
              </>
            ) : (
              "Verify email"
            )}
          </button>

          <button
            type="button"
            onClick={() => void handleRequestCode()}
            disabled={requestOtp.isPending}
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 border border-light-border bg-light-bg px-4 py-2 text-sm font-semibold text-light-text transition hover:border-primary-500 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text"
          >
            {requestOtp.isPending ? (
              <>
                <LoaderMini size={16} color="currentColor" />
                <span>Sending</span>
              </>
            ) : (
              "Resend code"
            )}
          </button>
        </>
      )}
    </div>
  );
}

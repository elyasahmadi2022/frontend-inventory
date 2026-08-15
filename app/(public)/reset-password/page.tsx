"use client";

import { AuthPageFrame } from "@/components/auth/auth-page-frame";
import { FormInputField } from "@/components/common";
import { LoaderMini } from "@/components/common/loader-mini";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  createResetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/lib/validation/auth-schemas";
import { appRoutes } from "@/routes/app-routes";
import { resetPasswordWithToken } from "@/services/auth.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { gooeyToast } from "goey-toast";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

function LockIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="11" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
      {hidden ? <path d="m4 4 16 16" /> : null}
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const { t } = useI18n();
  const [showsPassword, setShowsPassword] = useState(false);
  const [showsPasswordConfirm, setShowsPasswordConfirm] = useState(false);
  const schema = useMemo(() => createResetPasswordSchema(t), [t]);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!token) return;

    try {
      await resetPasswordWithToken({ token, newPassword: values.password });
      gooeyToast.success(t("resetPassword.successTitle"), {
        description: t("resetPassword.successDescription"),
      })

      router.push(appRoutes.login);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : t("resetPassword.errorFallback");
          gooeyToast.error(t("resetPassword.errorTitle"), {
            description: message
          })

    }
  });

  const features = [
    t("resetPassword.featureSecure"),
    t("resetPassword.featureUnique"),
    t("resetPassword.featureSignIn"),
  ];

  return (
    <AuthPageFrame
      aside={
        <>
          <div>
            
            <p className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-500">
              {t("resetPassword.eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-light-text dark:text-dark-text">
              {t("resetPassword.sideTitle")}
            </h2>
            <p className="mt-4 text-sm leading-7 text-light-muted dark:text-dark-muted">
              {t("resetPassword.sideDescription")}
            </p>
          </div>
          <ul className="mt-10 space-y-3">
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-3 text-sm text-light-text dark:text-dark-text"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-none bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-500">
                  <CheckIcon />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </>
      }
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-500">
        {t("resetPassword.eyebrow")}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-light-text dark:text-dark-text">
        {t("resetPassword.title")}
      </h1>
      <p className="mt-2 max-w-lg text-sm leading-6 text-light-muted dark:text-dark-muted">
        {t("resetPassword.description")}
      </p>

      {!token ? (
        <p className="mt-6 rounded-none border border-amber-400/30 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-400/25 dark:bg-amber-950/30 dark:text-amber-100">
          {t("resetPassword.noToken")}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <FormInputField
          control={control}
          name="password"
          label={t("resetPassword.newPassword")}
          type={showsPassword ? "text" : "password"}
          id="new-password"
          autoComplete="new-password"
          tone="light"
          placeholder={t("resetPassword.newPassword")}
          startIcon={<LockIcon />}
          endIcon={
            <button
              type="button"
              onClick={() => setShowsPassword((current) => !current)}
              className="grid h-8 w-8 place-items-center rounded-none text-light-muted transition hover:bg-primary-50 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 dark:text-dark-muted dark:hover:bg-primary-500/10 dark:hover:text-primary-500"
            >
              <EyeIcon hidden={showsPassword} />
            </button>
          }
        />
        <FormInputField
          control={control}
          name="confirmPassword"
          id="confirmPassword"
          label={t("resetPassword.confirmPassword")}
          type={showsPasswordConfirm ? "text" : "password"}
          autoComplete="new-password"
          tone="light"
          startIcon={<LockIcon />}
          placeholder={t("resetPassword.confirmPasswordPlaceholder")}
          endIcon={
            <button
              type="button"
              onClick={() => setShowsPasswordConfirm((current) => !current)}
              className="grid h-8 w-8 place-items-center rounded-none text-light-muted transition hover:bg-primary-50 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 dark:text-dark-muted dark:hover:bg-primary-500/10 dark:hover:text-primary-500"
            >
              <EyeIcon hidden={showsPasswordConfirm} />
            </button>
          }
        />
        <button
          type="submit"
          disabled={isSubmitting || !token}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-none border border-primary-500 bg-primary-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:border-primary-600 hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? <LoaderMini size={16} color="currentColor" /> : null}
          <span>{t("resetPassword.saveButton")}</span>
        </button>
      </form>

      <p className="mt-8 border-t border-light-border pt-6 text-center text-sm text-light-muted dark:border-dark-border dark:text-dark-muted">
        <Link
          href={appRoutes.login}
          className="font-semibold text-primary-600 transition hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 dark:text-primary-500 dark:hover:text-primary-100"
        >
          {t("resetPassword.backToLogin")}
        </Link>
      </p>
    </AuthPageFrame>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthPageFrame
          aside={<div className="h-40 animate-pulse rounded-none bg-light-bg dark:bg-dark-bg" />}
        >
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded-none bg-light-bg dark:bg-dark-bg" />
            <div className="h-4 w-full animate-pulse rounded-none bg-light-bg dark:bg-dark-bg" />
            <div className="h-11 animate-pulse rounded-none bg-light-bg dark:bg-dark-bg" />
            <div className="h-11 animate-pulse rounded-none bg-light-bg dark:bg-dark-bg" />
          </div>
        </AuthPageFrame>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

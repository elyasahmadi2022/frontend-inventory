"use client";

import { AuthPageFrame } from "@/components/auth/auth-page-frame";
import { FormInputField } from "@/components/common";
import { LoaderMini } from "@/components/common/loader-mini";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  createForgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validation/auth-schemas";
import { appRoutes } from "@/routes/app-routes";
import { requestPasswordReset } from "@/services/auth.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { gooeyToast } from "goey-toast";
import Link from "next/link";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

function EmailIcon() {
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
      <rect x="3" y="5" width="18" height="14" />
      <path d="m4 7 8 6 8-6" />
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

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const schema = useMemo(() => createForgotPasswordSchema(t), [t]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await requestPasswordReset(values.email.trim());
      gooeyToast.success(t("forgotPassword.successTitle"), {
        description: t("forgotPassword.successDescription")
      })
   
      reset();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : t("forgotPassword.errorFallback");
          gooeyToast.error( t("forgotPassword.errorTitle"),{
            description: message
          })
    }
  });

  const features = [
    t("forgotPassword.featureSecure"),
    t("forgotPassword.featureEmail"),
    t("forgotPassword.featureSupport"),
  ];

  return (
    <AuthPageFrame
      aside={
        <>
          <div>
            
            <p className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-500">
              {t("forgotPassword.eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-light-text dark:text-dark-text">
              {t("forgotPassword.sideTitle")}
            </h2>
            <p className="mt-4 text-sm leading-7 text-light-muted dark:text-dark-muted">
              {t("forgotPassword.sideDescription")}
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
        {t("forgotPassword.eyebrow")}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-light-text dark:text-dark-text">
        {t("forgotPassword.title")}
      </h1>
      <p className="mt-2 max-w-lg text-sm leading-6 text-light-muted dark:text-dark-muted">
        {t("forgotPassword.description")}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <FormInputField
          control={control}
          name="email"
          tone="light"
          startIcon={<EmailIcon />}
          id="email"
          label={t("login.email")}
          placeholder={t("login.emailPlaceholder")}
          type="email"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-none border border-primary-500 bg-primary-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:border-primary-600 hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? <LoaderMini size={16} color="currentColor" /> : null}
          <span>{t("forgotPassword.submit")}</span>
        </button>
      </form>

      <p className="mt-8 border-t border-light-border pt-6 text-center text-sm text-light-muted dark:border-dark-border dark:text-dark-muted">
        <Link
          href={appRoutes.login}
          className="font-semibold text-primary-600 transition hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 dark:text-primary-500 dark:hover:text-primary-100"
        >
          {t("forgotPassword.backToLogin")}
        </Link>
      </p>
    </AuthPageFrame>
  );
}

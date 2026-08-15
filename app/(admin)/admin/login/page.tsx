"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GuestOnly } from "@/components/auth/require-auth";
import { AuthLoginBackdrop } from "@/components/auth/auth-login-backdrop";
import { FormInputField } from "@/components/common";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  createLoginSchema,
  type LoginFormValues,
} from "@/lib/validation/auth-schemas";
import AdminLogin from "@/components/lottie/AdminLogin.json"
import { appRoutes } from "@/routes/app-routes";
import { LoaderMini } from "@/components/common/loader-mini";
import { gooeyToast } from "goey-toast";
import Lottie from "lottie-react";


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

export default function AdminLoginPage() {
  const { signIn } = useAuth();
  const { t } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const schema = useMemo(() => createLoginSchema(t), [t]);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const features = [
    t("adminLogin.featureOwners"),
    t("adminLogin.featureListings"),
    t("adminLogin.featureSecurity"),
  ];

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await signIn(
        {
          email: values.email.trim(),
          password: values.password,
        },
        { requireRole: "admin" },
      );
      gooeyToast.success(t("adminLogin.successTitle"), {
        description: t("adminLogin.successDescription"),
      })

      window.location.assign(result.redirectTo);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.code === "ROLE_MISMATCH"
            ? t("adminLogin.roleMismatch")
            : error.message
          : t("adminLogin.errorFallback");

      gooeyToast.error(t("adminLogin.errorTitle"), {
        description: message
      })

    }
  });

  return (
    <GuestOnly redirectTo={appRoutes.adminDashboard}>
      <AuthLoginBackdrop>
        <div className="page-shell flex flex-1 items-center py-10 md:py-14">
          <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-none border border-light-border/90 bg-light-surface/95 shadow-lg backdrop-blur-sm dark:border-dark-border/90 dark:bg-dark-surface/95 dark:shadow-dark-lg md:grid-cols-[0.9fr_1.1fr]">
            <aside className="admin-login-panel relative z-2 hidden overflow-hidden bg-transparent border-e border-light-border p-8 dark:border-dark-border md:flex md:flex-col md:justify-between lg:p-10">
              <div className=" absolute inset-0 w-full h-full -z-1 ">
                <Lottie animationData={AdminLogin} className="w-full h-full" />
              </div>

              <div className="">


                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-500">
                  {t("adminLogin.eyebrow")}
                </p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight text-light-text dark:text-dark-text">
                  {t("adminLogin.sideTitle")}
                </h2>
                <p className="mt-4 text-sm leading-7 text-light-muted dark:text-dark-muted">
                  {t("adminLogin.sideDescription")}
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
            </aside>

            <div className="p-6 sm:p-8 lg:p-12">

              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-500 md:mt-0">
                {t("adminLogin.eyebrow")}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-light-text dark:text-dark-text">
                {t("adminLogin.title")}
              </h1>
              <p className="mt-2 max-w-lg text-sm leading-6 text-light-muted dark:text-dark-muted">
                {t("adminLogin.description")}
              </p>

              <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
                <FormInputField
                  control={control}
                  name="email"
                  id="admin-email"
                  type="email"
                  label={t("adminLogin.email")}
                  placeholder={t("adminLogin.emailPlaceholder")}
                  autoComplete="username"
                  startIcon={<EmailIcon />}
                  tone="light"
                />

                <FormInputField
                  control={control}
                  name="password"
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  label={t("adminLogin.password")}
                  placeholder={t("adminLogin.passwordPlaceholder")}
                  autoComplete="current-password"
                  startIcon={<LockIcon />}
                  endIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={
                        showPassword
                          ? t("adminLogin.hidePassword")
                          : t("adminLogin.showPassword")
                      }
                      className="grid h-8 w-8 place-items-center rounded-none text-light-muted transition hover:bg-primary-50 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 dark:text-dark-muted dark:hover:bg-primary-500/10 dark:hover:text-primary-500"
                    >
                      <EyeIcon hidden={showPassword} />
                    </button>
                  }
                  tone="light"
                />

                <div className="flex justify-end">
                  <Link
                    href={appRoutes.forgotPassword}
                    className="text-sm font-semibold text-primary-600 transition hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 dark:text-primary-500 dark:hover:text-primary-100"
                  >
                    {t("adminLogin.forgotPassword")}
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-x-2 rounded-none border border-primary-500 bg-primary-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:border-primary-600 hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting
                    ? <><LoaderMini /> <span>{t("adminLogin.submit")}</span></>
                    : t("adminLogin.submit")}
                </button>
              </form>

              <div className="mt-8 border-t border-light-border pt-6 text-center text-sm text-light-muted dark:border-dark-border dark:text-dark-muted">
                <span>{t("adminLogin.wrongPlace")} </span>
                <Link
                  href={appRoutes.login}
                  className="font-semibold text-primary-600 transition hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 dark:text-primary-500 dark:hover:text-primary-100"
                >
                  {t("adminLogin.publicLogin")}
                </Link>


              </div>
            </div>
          </div>
        </div>
      </AuthLoginBackdrop>
    </GuestOnly>
  );
}

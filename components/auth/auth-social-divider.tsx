"use client";

import { useI18n } from "@/lib/i18n";

export function AuthSocialDivider() {
  const { t } = useI18n();

  return (
    <div className="relative my-6">
      <div
        className="absolute inset-0 flex items-center"
        aria-hidden="true"
      >
        <div className="w-full border-t border-light-border dark:border-dark-border" />
      </div>
      <p className="relative mx-auto w-fit bg-light-surface px-3 text-xs font-semibold uppercase tracking-[0.16em] text-light-muted dark:bg-dark-surface dark:text-dark-muted">
        {t("auth.orContinueWith")}
      </p>
    </div>
  );
}

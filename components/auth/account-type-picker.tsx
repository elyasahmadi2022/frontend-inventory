"use client";

import { Building2, UserRound } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export type RegisterAccountType = "owner" | "user";

type AccountTypePickerProps = {
  value: RegisterAccountType | null;
  onChange: (value: RegisterAccountType) => void;
};

export function AccountTypePicker({ value, onChange }: AccountTypePickerProps) {
  const { t } = useI18n();

  const options: Array<{
    id: RegisterAccountType;
    title: string;
    description: string;
    cta: string;
    icon: typeof Building2;
  }> = [
    {
      id: "owner",
      title: t("register.typeOwnerTitle"),
      description: t("register.typeOwnerDescription"),
      cta: t("register.typeOwnerCta"),
      icon: Building2,
    },
    {
      id: "user",
      title: t("register.typeUserTitle"),
      description: t("register.typeUserDescription"),
      cta: t("register.typeUserCta"),
      icon: UserRound,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {options.map((option) => {
        const Icon = option.icon;
        const selected = value === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={selected}
            className={`group flex h-full flex-col border p-5 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 ${
              selected
                ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10"
                : "border-light-border bg-light-surface hover:border-primary-500/50 dark:border-dark-border dark:bg-dark-surface"
            }`}
          >
            <span
              className={`grid h-11 w-11 place-items-center border ${
                selected
                  ? "border-primary-500 bg-primary-500 text-white"
                  : "border-light-border bg-light-bg text-primary-600 dark:border-dark-border dark:bg-dark-bg dark:text-primary-500"
              }`}
            >
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="mt-4 text-lg font-semibold text-light-text dark:text-dark-text">
              {option.title}
            </span>
            <span className="mt-2 text-sm leading-6 text-light-muted dark:text-dark-muted">
              {option.description}
            </span>
            <span className="mt-5 text-sm font-semibold text-primary-600 dark:text-primary-500">
              {option.cta}
            </span>
          </button>
        );
      })}
    </div>
  );
}

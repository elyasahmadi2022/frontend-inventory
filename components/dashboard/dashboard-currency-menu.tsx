"use client";

import { BadgeDollarSign } from "lucide-react";
import {
  DropdownContent,
  DropdownLabel,
  DropdownMenuRoot,
  DropdownRadioGroup,
  DropdownRadioItem,
  DropdownTrigger,
} from "@/components/common";
import {
  dashboardPreferenceOptionClass,
  dashboardPreferenceOptionDescriptionClass,
  dashboardPreferenceOptionMetaClass,
  dashboardPreferenceOptionTextClass,
  dashboardPreferenceOptionTitleClass,
  dashboardPreferenceTriggerClass,
} from "@/components/dashboard/dashboard-preference-menu-styles";
import { useCurrencyPreference } from "@/hooks/use-currency-preference";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import type { AppCurrency } from "@/lib/user-preferences";

const currencies: { code: AppCurrency; labelKey: TranslationKey; symbol: string }[] = [
  { code: "AFN", labelKey: "preferences.currency.afn", symbol: "؋" },
  { code: "USD", labelKey: "preferences.currency.usd", symbol: "$" },
  { code: "PKR", labelKey: "preferences.currency.pkr", symbol: "Rs" },
];

export function DashboardCurrencyMenu() {
  const { t } = useI18n();
  const { currency, changeCurrency } = useCurrencyPreference();
  const active =
    currencies.find((item) => item.code === currency) ?? currencies[0];

  function handleCurrencyChange(value: string) {
    if (value !== "AFN" && value !== "USD" && value !== "PKR") return;
    changeCurrency(value);
  }

  return (
    <DropdownMenuRoot>
      <DropdownTrigger
        tone="neutral"
        showArrow={false}
        aria-label={t("preferences.currency.select")}
        title={t("preferences.currency.select")}
        className={dashboardPreferenceTriggerClass}
      >
        <span className="flex h-full w-full items-center  justify-center gap-1.5">
          <BadgeDollarSign className="size-4" strokeWidth={1} aria-hidden />
          <span className="hidden text-xs font-semibold sm:inline">
            {active.code}
          </span>
        </span>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-64">
        <DropdownLabel>{t("preferences.currency.label")}</DropdownLabel>
        <DropdownRadioGroup
          value={currency}
          onValueChange={handleCurrencyChange}
        >
          {currencies.map((item) => (
            <DropdownRadioItem
              key={item.code}
              value={item.code}
            >
              <span className={dashboardPreferenceOptionClass}>
                <span className={dashboardPreferenceOptionTextClass}>
                  <span className={dashboardPreferenceOptionTitleClass}>
                    {item.code}
                  </span>
                  <span className={dashboardPreferenceOptionDescriptionClass}>
                    {t(item.labelKey)}
                  </span>
                </span>
                <span className={dashboardPreferenceOptionMetaClass}>
                  {item.symbol}
                </span>
              </span>
            </DropdownRadioItem>
          ))}
        </DropdownRadioGroup>
      </DropdownContent>
    </DropdownMenuRoot>
  );
}

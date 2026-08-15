"use client";

import { CalendarDays } from "lucide-react";
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
import { useCalendarPreference } from "@/hooks/use-calendar-preference";
import { appCalendarTypes } from "@/lib/date-format";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import type { AppCalendarType } from "@/lib/user-preferences";

const calendarLabelKeys: Record<AppCalendarType, TranslationKey> = {
  gregorian: "preferences.calendar.gregorian",
  hijri_shamsi: "preferences.calendar.hijri_shamsi",
  hijri_qamari: "preferences.calendar.hijri_qamari",
};

export function DashboardCalendarMenu() {
  const { t } = useI18n();
  const { calendarType, changeCalendarType } = useCalendarPreference();
  const active =
    appCalendarTypes.find((item) => item.value === calendarType) ??
    appCalendarTypes[0];

  function handleCalendarChange(value: string) {
    if (
      value !== "gregorian" &&
      value !== "hijri_shamsi" &&
      value !== "hijri_qamari"
    ) {
      return;
    }
    changeCalendarType(value as AppCalendarType);
  }

  return (
    <DropdownMenuRoot>
      <DropdownTrigger
        tone="neutral"
        showArrow={false}
        aria-label={t("preferences.calendar.select")}
        title={t("preferences.calendar.select")}
        className={dashboardPreferenceTriggerClass}
      >
        <span className="flex h-full w-full items-center justify-center gap-1.5">
          <CalendarDays className="size-4" strokeWidth={1} aria-hidden />
          <span className="hidden text-xs font-semibold sm:inline">
            {active.shortLabel}
          </span>
        </span>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-72">
        <DropdownLabel>{t("preferences.calendar.label")}</DropdownLabel>
        <DropdownRadioGroup
          value={calendarType}
          onValueChange={handleCalendarChange}
        >
          {appCalendarTypes.map((item) => (
            <DropdownRadioItem key={item.value} value={item.value}>
              <span className={dashboardPreferenceOptionClass}>
                <span className={dashboardPreferenceOptionTextClass}>
                  <span className={dashboardPreferenceOptionTitleClass}>
                    {t(calendarLabelKeys[item.value])}
                  </span>
                  <span className={dashboardPreferenceOptionDescriptionClass}>
                    {item.example}
                  </span>
                </span>
                <span className={dashboardPreferenceOptionMetaClass}>
                  {item.shortLabel}
                </span>
              </span>
            </DropdownRadioItem>
          ))}
        </DropdownRadioGroup>
      </DropdownContent>
    </DropdownMenuRoot>
  );
}

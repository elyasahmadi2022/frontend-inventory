import type { AppCalendarType, AppLanguage } from "@/lib/user-preferences";
import type { DateLib, DateLibOptions } from "react-day-picker";

export const appCalendarTypes: ReadonlyArray<{
  example: string;
  label: string;
  shortLabel: string;
  value: AppCalendarType;
}> = [
  {
    value: "gregorian",
    label: "Gregorian",
    shortLabel: "GR",
    example: "2026-07-15",
  },
  {
    value: "hijri_shamsi",
    label: "Hijri Shamsi",
    shortLabel: "HS",
    example: "1405-04-24",
  },
  {
    value: "hijri_qamari",
    label: "Hijri Qamari",
    shortLabel: "HQ",
    example: "1448-02-01",
  },
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

const afghanSolarHijriMonths = {
  local: [
    "حمل",
    "ثور",
    "جوزا",
    "سرطان",
    "اسد",
    "سنبله",
    "میزان",
    "عقرب",
    "قوس",
    "جدی",
    "دلو",
    "حوت",
  ],
  en: [
    "Hamal",
    "Sawr",
    "Jawza",
    "Saratan",
    "Asad",
    "Sonbola",
    "Mizan",
    "Aqrab",
    "Qaws",
    "Jadi",
    "Dalwa",
    "Hut",
  ],
} as const;

function formatCalendarNumber(value: number | string, dateLib?: DateLib) {
  return dateLib?.formatNumber(value) ?? String(value);
}

export function formatAfghanSolarHijriMonth(
  date: Date,
  language: AppLanguage,
  dateLib?: DateLib,
) {
  const monthIndex = dateLib?.getMonth(date) ?? date.getMonth();
  const monthNames =
    language === "en"
      ? afghanSolarHijriMonths.en
      : afghanSolarHijriMonths.local;
  return monthNames[monthIndex] ?? monthNames[0];
}

export function formatAfghanSolarHijriCaption(
  date: Date,
  language: AppLanguage,
  _options?: DateLibOptions,
  dateLib?: DateLib,
) {
  const year = dateLib?.getYear(date) ?? date.getFullYear();
  return `${formatAfghanSolarHijriMonth(date, language, dateLib)} ${formatCalendarNumber(year, dateLib)}`;
}

export function parseIsoDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function toIsoDate(value: Date): string {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
    value.getDate(),
  )}`;
}

/** Returns a calendar date in the user's local timezone (YYYY-MM-DD). */
export function getLocalDateString(value = new Date()): string {
  return toIsoDate(value);
}

export function formatAppDate(
  value: Date | string | null | undefined,
  calendarType: AppCalendarType,
  language: AppLanguage = "en",
) {
  const date =
    typeof value === "string"
      ? (parseIsoDate(value) ?? new Date(value))
      : (value ?? undefined);
  if (!date || Number.isNaN(date.getTime())) return "-";

  if (calendarType === "gregorian") return toIsoDate(date);

  const locale =
    calendarType === "hijri_shamsi"
      ? language === "en"
        ? "en-US-u-ca-persian-nu-latn"
        : "fa-AF-u-ca-persian"
      : language === "en"
        ? "en-US-u-ca-islamic-umalqura-nu-latn"
        : "ar-SA-u-ca-islamic-umalqura";

  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return toIsoDate(date);
  }
}

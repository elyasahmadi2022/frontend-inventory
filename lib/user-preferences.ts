export const LANGUAGE_STORAGE_KEY = "srs_language";
export const THEME_STORAGE_KEY = "srs_theme";
export const DATE_FORMAT_STORAGE_KEY = "srs_date_format";
export const CALENDAR_TYPE_STORAGE_KEY = "srs_calendar_type";
export const CURRENCY_STORAGE_KEY = "store_active_currency";
export const USER_PREFERENCES_CHANGED_EVENT = "srs:user-preferences-changed";

export type AppLanguage = "en" | "fa" | "ps";
export type AppTheme = "light" | "dark";
export type AppDateFormat = "mdy" | "dmy" | "ymd";
export type AppCalendarType = "gregorian" | "hijri_shamsi" | "hijri_qamari";
export type AppCurrency = "AFN" | "USD" | "PKR";

export const appLanguages: ReadonlyArray<{
  direction: "ltr" | "rtl";
  labels: Record<AppLanguage, string>;
  value: AppLanguage;
}> = [
  {
    value: "en",
    labels: { en: "English", fa: "انگلیسی", ps: "انګلیسي" },
    direction: "ltr",
  },
  {
    value: "fa",
    labels: { en: "Dari", fa: "دری", ps: "دري" },
    direction: "rtl",
  },
  {
    value: "ps",
    labels: { en: "Pashto", fa: "پشتو", ps: "پښتو" },
    direction: "rtl",
  },
];

function isAppLanguage(value: string | null): value is AppLanguage {
  return value === "en" || value === "fa" || value === "ps";
}

function isAppTheme(value: string | null): value is AppTheme {
  return value === "light" || value === "dark";
}

function isAppDateFormat(value: string | null): value is AppDateFormat {
  return value === "mdy" || value === "dmy" || value === "ymd";
}

function isAppCalendarType(value: string | null): value is AppCalendarType {
  return (
    value === "gregorian" ||
    value === "hijri_shamsi" ||
    value === "hijri_qamari"
  );
}

function isAppCurrency(value: string | null): value is AppCurrency {
  return value === "AFN" || value === "USD" || value === "PKR";
}

export function getStoredLanguage(): AppLanguage {
  if (typeof window === "undefined") return "en";
  const language = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isAppLanguage(language) ? language : "en";
}

export function getStoredDateFormat(): AppDateFormat {
  if (typeof window === "undefined") return "ymd";
  const dateFormat = localStorage.getItem(DATE_FORMAT_STORAGE_KEY);
  return isAppDateFormat(dateFormat) ? dateFormat : "ymd";
}

export function getStoredCalendarType(): AppCalendarType {
  if (typeof window === "undefined") return "gregorian";
  const calendarType = localStorage.getItem(CALENDAR_TYPE_STORAGE_KEY);
  return isAppCalendarType(calendarType) ? calendarType : "gregorian";
}

export function getStoredCurrency(): AppCurrency {
  if (typeof window === "undefined") return "AFN";
  const currency = localStorage.getItem(CURRENCY_STORAGE_KEY);
  return isAppCurrency(currency) ? currency : "AFN";
}

export function getStoredTheme(): AppTheme {
  if (typeof window === "undefined") return "light";
  const theme = localStorage.getItem(THEME_STORAGE_KEY);
  return isAppTheme(theme) ? theme : "light";
}

export function applyLanguage(language: AppLanguage): void {
  const option = appLanguages.find((item) => item.value === language);
  document.documentElement.lang = language;
  document.documentElement.dir = option?.direction ?? "ltr";
}

export function getLanguageDirection(language: AppLanguage): "ltr" | "rtl" {
  return (
    appLanguages.find((item) => item.value === language)?.direction ?? "ltr"
  );
}

export function applyTheme(theme: AppTheme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function notifyPreferencesChanged(): void {
  window.dispatchEvent(new Event(USER_PREFERENCES_CHANGED_EVENT));
}

export function setStoredLanguage(language: AppLanguage): void {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  applyLanguage(language);
  notifyPreferencesChanged();
}

export function setStoredTheme(theme: AppTheme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
  notifyPreferencesChanged();
}

export function setStoredDateFormat(dateFormat: AppDateFormat): void {
  localStorage.setItem(DATE_FORMAT_STORAGE_KEY, dateFormat);
  notifyPreferencesChanged();
}

export function setStoredCalendarType(calendarType: AppCalendarType): void {
  localStorage.setItem(CALENDAR_TYPE_STORAGE_KEY, calendarType);
  notifyPreferencesChanged();
}

export function setStoredCurrency(currency: AppCurrency): void {
  localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  notifyPreferencesChanged();
}

export function subscribeToUserPreferences(
  onStoreChange: () => void,
): () => void {
  function handleStorage(event: StorageEvent) {
    if (
      event.key === LANGUAGE_STORAGE_KEY ||
      event.key === THEME_STORAGE_KEY ||
      event.key === DATE_FORMAT_STORAGE_KEY ||
      event.key === CALENDAR_TYPE_STORAGE_KEY ||
      event.key === CURRENCY_STORAGE_KEY
    ) {
      applyLanguage(getStoredLanguage());
      applyTheme(getStoredTheme());
      onStoreChange();
    }
  }

  window.addEventListener(USER_PREFERENCES_CHANGED_EVENT, onStoreChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(USER_PREFERENCES_CHANGED_EVENT, onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export const userPreferencesBootstrapScript = `
(() => {
  try {
    const root = document.documentElement;
    const theme = localStorage.getItem("${THEME_STORAGE_KEY}");
    const language = localStorage.getItem("${LANGUAGE_STORAGE_KEY}");
    root.classList.toggle("dark", theme === "dark");
    root.lang = language === "fa" || language === "ps" ? language : "en";
    root.dir = root.lang === "en" ? "ltr" : "rtl";
  } catch {}
})();
`;

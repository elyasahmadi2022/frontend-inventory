"use client";

import { useCallback, useSyncExternalStore } from "react";
import en from "@/messages/en.json";
import fa from "@/messages/fa.json";
import ps from "@/messages/ps.json";
import {
  getLanguageDirection,
  getStoredLanguage,
  setStoredLanguage,
  subscribeToUserPreferences,
  type AppLanguage,
} from "@/lib/user-preferences";

const dictionaries = { en, fa, ps } as const;

export type TranslationKey = keyof typeof en;
type TranslationParams = Record<string, string | number>;

function interpolate(value: string, params?: TranslationParams): string {
  if (!params) return value;
  return value.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    Object.hasOwn(params, key) ? String(params[key]) : match,
  );
}

export function getDirection(language: AppLanguage): "ltr" | "rtl" {
  return getLanguageDirection(language);
}

export function setDocumentDirection(language: AppLanguage): void {
  document.documentElement.lang = language;
  document.documentElement.dir = getDirection(language);
}

export function useI18n() {
  const language = useSyncExternalStore<AppLanguage>(
    subscribeToUserPreferences,
    getStoredLanguage,
    () => "en",
  );

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams): string => {
      const dictionary = dictionaries[language] as Partial<
        Record<TranslationKey, string>
      >;
      return interpolate(dictionary[key] ?? en[key], params);
    },
    [language],
  );

  const changeLanguage = useCallback((nextLanguage: AppLanguage) => {
    setStoredLanguage(nextLanguage);
  }, []);

  return {
    changeLanguage,
    direction: getLanguageDirection(language),
    language,
    t,
  };
}

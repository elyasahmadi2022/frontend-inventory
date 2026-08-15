"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getStoredCurrency,
  setStoredCurrency,
  subscribeToUserPreferences,
  type AppCurrency,
} from "@/lib/user-preferences";

export function useCurrencyPreference() {
  const currency = useSyncExternalStore<AppCurrency>(
    subscribeToUserPreferences,
    getStoredCurrency,
    () => "AFN",
  );

  const changeCurrency = useCallback((nextCurrency: AppCurrency) => {
    setStoredCurrency(nextCurrency);
  }, []);

  return { changeCurrency, currency };
}

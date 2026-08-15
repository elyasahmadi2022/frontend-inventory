"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getStoredCalendarType,
  setStoredCalendarType,
  subscribeToUserPreferences,
  type AppCalendarType,
} from "@/lib/user-preferences";

export function useCalendarPreference() {
  const calendarType = useSyncExternalStore<AppCalendarType>(
    subscribeToUserPreferences,
    getStoredCalendarType,
    () => "gregorian",
  );

  const changeCalendarType = useCallback((nextType: AppCalendarType) => {
    setStoredCalendarType(nextType);
  }, []);

  return { calendarType, changeCalendarType };
}

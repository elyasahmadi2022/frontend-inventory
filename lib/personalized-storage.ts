"use client";

const LEGACY_FAVORITES_KEY = "luilal:saved-properties";
const LEGACY_COMPARE_KEY = "luilal:compare-properties";
const LEGACY_RECENT_KEY = "luilal:recent-properties";

const FAVORITES_BASE = "luilal:saved-properties";
const COMPARE_BASE = "luilal:compare-properties";
const RECENT_BASE = "luilal:recent-properties";

export type PersonalizationScope = "guest" | number | string ;

function scopeKey(base: string, scope: PersonalizationScope): string {
  return scope === "guest" ? `${base}:guest` : `${base}:user:${scope}`;
}

function readIds(key: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is number => typeof id === "number");
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: number[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(ids));
}

function removeKey(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

function migrateLegacyKey(legacyKey: string, scopedKey: string) {
  const legacy = readIds(legacyKey);
  if (legacy.length === 0) return;
  if (readIds(scopedKey).length === 0) {
    writeIds(scopedKey, legacy);
  }
  removeKey(legacyKey);
}

export function favoritesKey(scope: PersonalizationScope): string {
  return scopeKey(FAVORITES_BASE, scope);
}

export function compareKey(scope: PersonalizationScope): string {
  return scopeKey(COMPARE_BASE, scope);
}

export function recentKey(scope: PersonalizationScope): string {
  return scopeKey(RECENT_BASE, scope);
}

export function readScopedFavoriteIds(scope: PersonalizationScope): number[] {
  if (scope === "guest") {
    migrateLegacyKey(LEGACY_FAVORITES_KEY, favoritesKey("guest"));
  }
  return readIds(favoritesKey(scope));
}

export function writeScopedFavoriteIds(
  scope: PersonalizationScope,
  ids: number[],
): void {
  writeIds(favoritesKey(scope), ids);
}

export function readScopedCompareIds(scope: PersonalizationScope): number[] {
  if (scope === "guest") {
    migrateLegacyKey(LEGACY_COMPARE_KEY, compareKey("guest"));
  }
  return readIds(compareKey(scope));
}

export function writeScopedCompareIds(
  scope: PersonalizationScope,
  ids: number[],
): void {
  writeIds(compareKey(scope), ids);
}

export function readScopedRecentIds(scope: PersonalizationScope): number[] {
  if (scope === "guest") {
    migrateLegacyKey(LEGACY_RECENT_KEY, recentKey("guest"));
  }
  return readIds(recentKey(scope));
}

export function writeScopedRecentIds(
  scope: PersonalizationScope,
  ids: number[],
): void {
  writeIds(recentKey(scope), ids);
}

/** Remove guest + legacy keys so the next session does not inherit another account's data. */
export function clearPersonalizedDataOnLogout(): void {
  removeKey(LEGACY_FAVORITES_KEY);
  removeKey(LEGACY_COMPARE_KEY);
  removeKey(LEGACY_RECENT_KEY);
  removeKey(favoritesKey("guest"));
  removeKey(compareKey("guest"));
  removeKey(recentKey("guest"));
}

export function clearGuestFavorites(): void {
  removeKey(favoritesKey("guest"));
  removeKey(LEGACY_FAVORITES_KEY);
}

export const NOTIFICATION_PREFS_KEY = "srs_notification_prefs";
export const NOTIFICATION_PREFS_CHANGED_EVENT = "srs:notification-prefs-changed";

export type NotificationPreferences = {
  emailVerification: boolean;
  emailListings: boolean;
  emailMarketing: boolean;
  inAppAlerts: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  emailVerification: true,
  emailListings: true,
  emailMarketing: false,
  inAppAlerts: true,
};

let cachedRaw: string | null | undefined;
let cachedSnapshot: NotificationPreferences = DEFAULT_NOTIFICATION_PREFS;

function readPreferencesFromStorage(): NotificationPreferences {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_PREFS;

  try {
    const raw = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (raw === cachedRaw) return cachedSnapshot;

    cachedRaw = raw;
    if (!raw) {
      cachedSnapshot = DEFAULT_NOTIFICATION_PREFS;
      return cachedSnapshot;
    }

    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    cachedSnapshot = { ...DEFAULT_NOTIFICATION_PREFS, ...parsed };
    return cachedSnapshot;
  } catch {
    cachedRaw = null;
    cachedSnapshot = DEFAULT_NOTIFICATION_PREFS;
    return cachedSnapshot;
  }
}

function notifyChanged(): void {
  window.dispatchEvent(new Event(NOTIFICATION_PREFS_CHANGED_EVENT));
}

export function getNotificationPreferences(): NotificationPreferences {
  return readPreferencesFromStorage();
}

export function setNotificationPreference<K extends keyof NotificationPreferences>(
  key: K,
  value: NotificationPreferences[K],
): NotificationPreferences {
  const next = { ...getNotificationPreferences(), [key]: value };
  cachedSnapshot = next;
  cachedRaw = JSON.stringify(next);
  localStorage.setItem(NOTIFICATION_PREFS_KEY, cachedRaw);
  notifyChanged();
  return next;
}

export function subscribeToNotificationPreferences(
  onStoreChange: () => void,
): () => void {
  function handleStorage(event: StorageEvent) {
    if (event.key === NOTIFICATION_PREFS_KEY) {
      cachedRaw = undefined;
      onStoreChange();
    }
  }

  window.addEventListener(NOTIFICATION_PREFS_CHANGED_EVENT, onStoreChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(NOTIFICATION_PREFS_CHANGED_EVENT, onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

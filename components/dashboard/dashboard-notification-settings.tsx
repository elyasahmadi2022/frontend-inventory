"use client";

import { useSyncExternalStore } from "react";
import { Bell } from "lucide-react";
import { ToggleSwitch } from "@/components/common/toggle-switch";
import { SettingsLinkRow, SettingsRow } from "@/components/dashboard/settings-ui";
import { useI18n } from "@/lib/i18n";
import {
  DEFAULT_NOTIFICATION_PREFS,
  getNotificationPreferences,
  setNotificationPreference,
  subscribeToNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notification-preferences";
import { appRoutes } from "@/routes/app-routes";

function useNotificationPrefs(): NotificationPreferences {
  return useSyncExternalStore(
    subscribeToNotificationPreferences,
    getNotificationPreferences,
    () => DEFAULT_NOTIFICATION_PREFS,
  );
}

export function DashboardNotificationSettings() {
  const { t } = useI18n();
  const prefs = useNotificationPrefs();

  return (
    <>
      <SettingsLinkRow
        href={appRoutes.dashboardNotifications}
        icon={Bell}
        label={t("dashboard.settings.openNotifications")}
        description={t("dashboard.settings.inboxRowDescription")}
      />

      <SettingsRow
        label={t("dashboard.settings.notifVerificationLabel")}
        description={t("dashboard.settings.notifVerificationDescription")}
      >
        <ToggleSwitch
          id="notif-email-verification"
          checked={prefs.emailVerification}
          onCheckedChange={(checked) =>
            setNotificationPreference("emailVerification", checked)
          }
        />
      </SettingsRow>

      <SettingsRow
        label={t("dashboard.settings.notifListingsLabel")}
        description={t("dashboard.settings.notifListingsDescription")}
      >
        <ToggleSwitch
          id="notif-email-listings"
          checked={prefs.emailListings}
          onCheckedChange={(checked) =>
            setNotificationPreference("emailListings", checked)
          }
        />
      </SettingsRow>

      <SettingsRow
        label={t("dashboard.settings.notifInAppLabel")}
        description={t("dashboard.settings.notifInAppDescription")}
      >
        <ToggleSwitch
          id="notif-in-app"
          checked={prefs.inAppAlerts}
          onCheckedChange={(checked) =>
            setNotificationPreference("inAppAlerts", checked)
          }
        />
      </SettingsRow>

      <SettingsRow
        label={t("dashboard.settings.notifMarketingLabel")}
        description={t("dashboard.settings.notifMarketingDescription")}
      >
        <ToggleSwitch
          id="notif-marketing"
          checked={prefs.emailMarketing}
          onCheckedChange={(checked) =>
            setNotificationPreference("emailMarketing", checked)
          }
        />
      </SettingsRow>
    </>
  );
}

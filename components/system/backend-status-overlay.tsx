"use client";

import { AlertTriangle, RefreshCw, ServerCrash } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  fetchApiHealth,
  getBackendStatus,
  subscribeToBackendStatus,
} from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export function BackendStatusOverlay() {
  const { t } = useI18n();
  const status = useSyncExternalStore(
    subscribeToBackendStatus,
    getBackendStatus,
    getBackendStatus,
  );
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!status.unavailable) return;

    const interval = window.setInterval(() => {
      void fetchApiHealth();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [status.unavailable]);

  if (!status.unavailable) return null;

  const handleRetry = async () => {
    setChecking(true);
    try {
      const result = await fetchApiHealth();
      if (result.ok) {
        window.location.reload();
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-light-bg/96 px-4 py-8 backdrop-blur-sm dark:bg-dark-bg/96">
      <div className="w-full max-w-lg border border-light-border bg-light-surface shadow-lg dark:border-dark-border dark:bg-dark-surface dark:shadow-dark-lg">
        <div className="border-b border-light-border px-6 py-4 dark:border-dark-border">
          <div className="inline-flex items-center gap-2 border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
            <AlertTriangle className="size-4" />
            {t("system.backendUnavailable.badge")}
          </div>
        </div>

        <div className="space-y-4 px-6 py-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex size-11 shrink-0 items-center justify-center border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
              <ServerCrash className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-light-text dark:text-dark-text">
                {t("system.backendUnavailable.title")}
              </h2>
              <p className="mt-1 text-sm leading-6 text-light-muted dark:text-dark-muted">
                {t("system.backendUnavailable.description")}
              </p>
            </div>
          </div>

          <div className="border border-light-border bg-light-bg px-4 py-3 dark:border-dark-border dark:bg-dark-bg">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-light-muted dark:text-dark-muted">
              {t("system.backendUnavailable.detailsLabel")}
            </p>
            <p className="mt-2 text-sm leading-6 text-light-text dark:text-dark-text">
              {status.message || t("system.backendUnavailable.fallbackMessage")}
            </p>
          </div>

          <p className="text-sm leading-6 text-light-muted dark:text-dark-muted">
            {t("system.backendUnavailable.maintenanceHint")}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleRetry()}
              disabled={checking}
              className="inline-flex min-h-10 items-center gap-2 border border-primary-500 bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:border-primary-600 hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`size-4 ${checking ? "animate-spin" : ""}`} />
              {checking
                ? t("system.backendUnavailable.checking")
                : t("system.backendUnavailable.retry")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

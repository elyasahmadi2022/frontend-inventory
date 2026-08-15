"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { LoaderMini } from "@/components/common/loader-mini";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  closeLabel?: string;
  workingLabel?: string;
  tone?: "danger" | "default";
  submitting?: boolean;
  confirmDisabled?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  closeLabel = "Close dialog",
  workingLabel = "Working",
  tone = "default",
  submitting = false,
  confirmDisabled = false,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, submitting]);

  if (!open || typeof document === "undefined") return null;

  const confirmClass =
    tone === "danger"
      ? "border border-red-500/30 bg-red-600 text-white hover:bg-red-500"
      : "border border-primary-500/30 bg-primary-600 text-white hover:bg-primary-500";

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label={closeLabel}
        className="absolute inset-0 bg-light-bg/60 backdrop-blur-[2px] dark:bg-dark-bg/70"
        onClick={() => {
          if (!submitting) onClose();
        }}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby={description ? "confirm-modal-description" : undefined}
        className="relative z-10 w-full max-w-md border border-light-border bg-light-surface shadow-2xl shadow-black/10 dark:border-dark-border dark:bg-dark-surface dark:shadow-black/40"
      >
        <div className="flex items-start gap-4 px-5 py-5 sm:px-6">
          <div
            className={
              tone === "danger"
                ? "inline-flex size-10 shrink-0 items-center justify-center border border-red-500/20 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                : "inline-flex size-10 shrink-0 items-center justify-center border border-primary-500/20 bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400"
            }
          >
            <AlertTriangle className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2
                id="confirm-modal-title"
                className="text-base font-semibold text-light-text dark:text-dark-text"
              >
                {title}
              </h2>
              <button
                type="button"
                aria-label={closeLabel}
                disabled={submitting}
                onClick={onClose}
                className="inline-flex size-8 shrink-0 items-center justify-center text-light-muted transition hover:text-light-text disabled:opacity-50 dark:text-dark-muted dark:hover:text-dark-text"
              >
                <X className="size-4" />
              </button>
            </div>
            {description ? (
              <p
                id="confirm-modal-description"
                className="mt-2 text-sm text-light-muted dark:text-dark-muted"
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-light-border bg-light-bg/50 px-5 py-4 dark:border-dark-border dark:bg-dark-bg/40 sm:px-6">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="inline-flex min-h-10 items-center justify-center border border-light-border bg-light-surface px-4 py-2 text-sm font-semibold text-light-text transition hover:border-primary-500/40 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={submitting || confirmDisabled}
            onClick={onConfirm}
            className={`inline-flex min-h-10 items-center justify-center gap-2 px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${confirmClass}`}
          >
            {submitting ? (
              <>
                <LoaderMini size={16} color="currentColor" />
                <span>{workingLabel}</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

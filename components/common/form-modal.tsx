"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { LoaderMini } from "@/components/common/loader-mini";

type FormModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  closeLabel?: string;
  submittingLabel?: string;
  panelClassName?: string;
  contentClassName?: string;
  footerContent?: ReactNode;
};

export function FormModal({
  open,
  title,
  description,
  children,
  onClose,
  onSubmit,
  submitting = false,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  closeLabel = "Close",
  submittingLabel = "Saving",
  panelClassName,
  contentClassName,
  footerContent,
}: FormModalProps) {
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

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label={closeLabel}
        className="absolute inset-0 bg-light-bg/60 backdrop-blur-[2px] dark:bg-dark-bg/70"
        onClick={() => {
          if (!submitting) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
        className={`relative z-10 flex max-h-[min(92vh,44rem)] w-full max-w-2xl flex-col overflow-hidden border border-light-border bg-light-surface shadow-2xl shadow-black/10 dark:border-dark-border dark:bg-dark-surface dark:shadow-black/40 ${panelClassName ?? ""}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-light-border px-5 py-4 dark:border-dark-border sm:px-6">
          <div className="min-w-0">
            <h2
              id="form-modal-title"
              className="text-base font-semibold text-light-text dark:text-dark-text sm:text-lg"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label={closeLabel}
            disabled={submitting}
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center border border-transparent text-light-muted transition hover:border-light-border hover:bg-light-bg hover:text-light-text disabled:opacity-50 dark:text-dark-muted dark:hover:border-dark-border dark:hover:bg-dark-bg dark:hover:text-dark-text"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <div
            className={`grid gap-4 sm:grid-cols-2 ${contentClassName ?? ""}`}
          >
            {children}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-light-border bg-light-bg/50 px-5 py-4 dark:border-dark-border dark:bg-dark-bg/40 sm:px-6">
          {footerContent ? <div>{footerContent}</div> : <span />}
          <div className="flex flex-wrap items-center gap-3">
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
              disabled={submitting}
              onClick={onSubmit}
              className="inline-flex min-h-10 items-center justify-center gap-2 border border-primary-500/30 bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoaderMini size={16} color="currentColor" />
                  <span>{submittingLabel}</span>
                </>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

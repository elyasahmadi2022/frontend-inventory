"use client";

import { useEffect } from "react";

type ImageLightboxProps = {
  open: boolean;
  src: string | null;
  alt?: string;
  caption?: string;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
};

export function ImageLightbox({
  open,
  src,
  alt = "Preview",
  caption,
  onClose,
  onPrevious,
  onNext,
}: ImageLightboxProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrevious?.();
      if (event.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, onNext, onPrevious]);

  if (!open || !src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image preview dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image preview"
            className="rounded-none border border-dark-border bg-dark-surface px-3 py-1 text-xs font-semibold text-dark-text transition hover:border-primary-500 hover:text-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
          >
            Close
          </button>
        </div>
        <div className="relative overflow-hidden rounded-none border border-dark-border bg-dark-surface shadow-dark-lg">
          {onPrevious ? (
            <button
              type="button"
              onClick={onPrevious}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center border border-white/20 bg-black/50 text-white"
            >
              ‹
            </button>
          ) : null}
          {onNext ? (
            <button
              type="button"
              onClick={onNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center border border-white/20 bg-black/50 text-white"
            >
              ›
            </button>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            loading="eager"
            decoding="async"
            className="max-h-[75vh] w-full object-contain"
          />
        </div>
        {caption ? (
          <p className="mt-2 text-center text-xs text-dark-muted">{caption}</p>
        ) : null}
      </div>
    </div>
  );
}


"use client";

import Lottie from "lottie-react";
import ErrorAnimation from "@/components/lottie/Error_animation.json";
import HomeIcon from "./home-icon";
import { HiArrowPath } from "react-icons/hi2";

type ErrorStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  animation?: object;
  fullScreen?: boolean;
  className?: string;
};

export default function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load the requested information. Please try again. If the problem persists, contact support.",
  actionLabel = "Try Again",
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  animation = ErrorAnimation,
  fullScreen = false,
  className = "",
}: ErrorStateProps) {
  return (
    <section
      className={[
        "flex items-center justify-center   bg-white dark:bg-dark-surface px-6",
        fullScreen ? "min-h-screen" : "min-h-[70vh]",
        className,
      ].join(" ")}
    >
      <div className="w-full max-w-xl rounded-none  dark:border-dark-border   p-8 text-center">

        <Lottie
          animationData={animation}
          loop
          className="mx-auto h-60 w-60"
        />

        <h1 className="mt-2 text-3xl font-bold text-light-text dark:text-dark-text">
          {title}
        </h1>

        <p className="mt-4 text-sm leading-7 text-light-muted dark:text-dark-muted">
          {description}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {onAction && (
            <button
              onClick={onAction}
              className="inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-xl bg-primary px-6 font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-95"
            >
              <HiArrowPath />
              {actionLabel}
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-xl border border-light-border dark:border-dark-border px-6 font-medium transition-colors hover:bg-light-muted/10 dark:hover:bg-dark-muted/10"
            >
              <HomeIcon />
              {secondaryActionLabel}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

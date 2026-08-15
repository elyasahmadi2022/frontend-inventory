
"use client";
import Anauthorized from "@/components/lottie/Anauthorizied.json"
import Lottie from "lottie-react";

type UnauthorizedStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  fullScreen?: boolean;
};

export default function UnauthorizedState({
  title = "Access Denied",
  description = "You don't have permission to access this page. If you believe this is a mistake, please contact your administrator.",
  actionLabel = "Go Back",
  onAction,
  className = "",
  fullScreen = false,
}: UnauthorizedStateProps) {
  return (
    <section
      className={[
        "flex items-center justify-center bg-white dark:bg-dark-surface px-6",
        fullScreen ? "min-h-screen" : "min-h-[70vh]",
        className,
      ].join(" ")}
    >
      <div className="w-full max-w-lg  border border-light-border dark:border-dark-border  p-8  text-center">

        <div className="mx-auto flex h-25 w-25 items-center justify-center rounded-none">
          <Lottie  animationData={Anauthorized} loop={true} autoPlay={true} className="h-50 w-50"/>
        </div>

        <h1 className="mt-6 text-3xl font-bold text-light-text dark:text-dark-text">
          {title}
        </h1>

        <p className="mt-3 text-sm leading-7 text-light-muted dark:text-dark-muted">
          {description}
        </p>

        <button
          type="button"
          onClick={onAction}
          className="mt-8 inline-flex h-12 min-w-[180px] items-center justify-center rounded-xl bg-primary px-6 font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-95"
        >
          {actionLabel}
        </button>
      </div>
    </section>
  );
}

"use client";

import type { ReactNode } from "react";
import { AuthLoginBackdrop } from "@/components/auth/auth-login-backdrop";

type AuthPageFrameProps = {
  aside: ReactNode;
  children: ReactNode;
  /** Tailwind max-width utility without `max-w-` prefix, e.g. `5xl` or `6xl`. */
  maxWidth?: "5xl" | "6xl" | "md";
  /** Additional grid column classes for the shell card. */
  gridClassName?: string;
};

const maxWidthClasses = {
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  md: "max-w-md",
} as const;

export function AuthPageFrame({
  aside,
  children,
  maxWidth = "5xl",
  gridClassName = "md:grid-cols-[0.9fr_1.1fr]",
}: AuthPageFrameProps) {
  return (
    <AuthLoginBackdrop>
      <div className="page-shell flex flex-1 items-center py-10 md:py-14">
        <div
          className={`mx-auto grid w-full ${maxWidthClasses[maxWidth]} overflow-hidden rounded-none border border-light-border/90 bg-light-surface/95 shadow-lg backdrop-blur-sm dark:border-dark-border/90 dark:bg-dark-surface/95 dark:shadow-dark-lg ${gridClassName}`}
        >
          <aside className="auth-login-panel relative hidden overflow-hidden border-e border-light-border p-8 dark:border-dark-border md:flex md:flex-col md:justify-between lg:p-10">
            
            <div className="relative flex flex-1 flex-col">{aside}</div>
          </aside>
          <div className="p-6 sm:p-8 lg:p-12">{children}</div>
        </div>
      </div>
    </AuthLoginBackdrop>
  );
}

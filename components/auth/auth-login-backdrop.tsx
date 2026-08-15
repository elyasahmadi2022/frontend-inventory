"use client";

import type { ReactNode } from "react";

type AuthLoginBackdropProps = {
  children: ReactNode;
};

/**
 * Full-viewport sign-in scene: quiet grid, ledger panel wash, and accent edge.
 * Shared by public and admin login pages for light and dark themes.
 */
export function AuthLoginBackdrop({ children }: AuthLoginBackdropProps) {
  return (
    <section className="auth-login-scene relative flex min-h-screen flex-1 flex-col overflow-hidden text-light-text dark:text-dark-text">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-light-bg dark:bg-dark-bg" />

        <div className="auth-login-grid absolute inset-0" />

        <div className="auth-login-wash absolute inset-0" />

        <div className="absolute inset-y-0 inset-s-0 w-px bg-light-border/80 dark:bg-dark-border/80" />
        

        <div className="absolute inset-x-0 bottom-0 h-px bg-light-border dark:bg-dark-border" />

        <div className="auth-login-corner absolute inset-s-8 top-8 hidden h-16 w-16 border-s-2 border-t-2 border-primary-500/25 md:block dark:border-primary-500/35" />
        <div className="auth-login-corner absolute bottom-8 inset-e-8 hidden h-16 w-16 border-e-2 border-b-2 border-primary-500/20 md:block dark:border-primary-500/30" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </section>
  );
}

/** @deprecated Use AuthLoginBackdrop */
export const AdminLoginBackdrop = AuthLoginBackdrop;

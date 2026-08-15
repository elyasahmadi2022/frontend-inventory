import Image from "next/image";
import type { ReactNode } from "react";
import CoverImage from "@/public/cover.png"
function CornerMark({ position }: { position: "tl" | "tr" }) {
  const pos =
    position === "tl"
      ? "left-0 top-0"
      : "right-0 top-0 scale-x-[-1]";
  return (
    <span className={`pointer-events-none absolute ${pos} h-3 w-3 opacity-40`}>
      <span className="absolute left-0 top-0 h-3 w-px bg-primary-500" />
      <span className="absolute left-0 top-0 h-px w-3 bg-primary-500" />
    </span>
  );
}
type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function AdminPageHeader({
  eyebrow = "Admin console",
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-light-border dark:border-dark-border">

      {/* Cover image */}
      <Image
        src={CoverImage}
        alt=""
        fill 
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Additional gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />

      <CornerMark position="tl" />
      <CornerMark position="tr" />

      <div className="relative px-4 py-5 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-3 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white sm:text-[11px] sm:tracking-[0.24em]">
              {eyebrow}
            </p>

            <h1 className="headline-luxury mt-1.5 break-words text-2xl leading-tight text-white sm:mt-2 sm:text-3xl md:text-5xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-3xl text-xs leading-relaxed text-white/80 sm:mt-3 sm:text-sm">
                {description}
              </p>
            ) : null}
          </div>

          {actions && (
            <div className="flex w-full flex-wrap items-center gap-1.5 rounded-xl bg-white/10 p-1.5 backdrop-blur-md sm:w-auto sm:gap-2 sm:p-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type AdminStatCardProps = {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: "default" | "warning" | "success" | "neutral";
  hint?: ReactNode;
};

const TONE_STYLES: Record<NonNullable<AdminStatCardProps["tone"]>, { bg: string; swatch: string; iconHover: string }> = {
  default: {
    bg: "bg-primary-50 dark:bg-primary-500/10",
    swatch: "bg-primary-500",
    iconHover: "group-hover:text-primary-600 dark:group-hover:text-primary-500",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    swatch: "bg-amber-400",
    iconHover: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
  },
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    swatch: "bg-emerald-400",
    iconHover: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
  },
  neutral: {
    bg: "bg-light-bg dark:bg-dark-bg",
    swatch: "bg-light-muted dark:bg-dark-muted",
    iconHover: "group-hover:text-light-text dark:group-hover:text-dark-text",
  },
};

export function AdminStatCard({
  label,
  value,
  icon,
  tone = "default",
  hint,
}: AdminStatCardProps) {
  const styles = TONE_STYLES[tone];

  return (
    <div
      className={`group relative min-w-0 border border-light-border p-3 shadow-xs transition-shadow duration-200 hover:shadow-md sm:p-5 dark:border-dark-border dark:shadow-dark-xs dark:hover:shadow-dark-md ${styles.bg}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 ${styles.swatch}`} />
          <p className="break-words font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted sm:text-[10px] sm:tracking-[0.2em]">
            {label}
          </p>
        </div>
        <span className={`text-light-muted transition-colors duration-200 dark:text-dark-muted ${styles.iconHover}`}>
          {icon}
        </span>
      </div>

      <div className="mt-2 min-w-0 break-words font-mono text-lg font-semibold leading-tight tabular-nums text-light-text sm:mt-3 sm:text-3xl sm:leading-none dark:text-dark-text">
        {value}
      </div>

      {hint ? <div className="mt-1.5 break-words text-[10px] leading-snug text-muted sm:mt-2 sm:text-xs">{hint}</div> : null}
    </div>
  );
}

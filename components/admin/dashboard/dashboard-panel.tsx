import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";


export function AdminKpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
  tone?: "default" | "warning" | "success" | "neutral" | "error";
}) {
  const iconBg =
    tone === "error"
      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
      : tone === "warning"
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
      : tone === "success"
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
        : "bg-primary-500/12 text-primary-600 dark:text-primary-400";
  const valueClass =
    tone === "error"
      ? "text-rose-700 dark:text-rose-300"
      : tone === "warning"
        ? "text-amber-700 dark:text-amber-300"
        : tone === "success"
          ? "text-emerald-700 dark:text-emerald-300"
          : "text-light-text dark:text-dark-text";

  return (
    <article className="group relative min-w-0 overflow-hidden border border-light-border bg-light-surface p-2.5 shadow-xs transition hover:border-primary-500/25 hover:shadow-sm sm:p-4 dark:border-dark-border dark:bg-dark-surface dark:shadow-dark-xs dark:hover:shadow-dark-sm">
      <div
        className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-primary-500/5 blur-2xl transition group-hover:bg-primary-500/10"
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-1.5 sm:gap-3">
        <div className="min-w-0">
          <p className="break-words text-[9px] font-bold uppercase leading-tight tracking-[0.1em] text-muted sm:text-[10px] sm:tracking-[0.18em]">
            {label}
          </p>
          <div className={`mt-1.5 min-w-0 break-words text-lg font-semibold leading-tight tabular-nums tracking-tight sm:mt-2 sm:text-[1.65rem] ${valueClass}`}>
            {value}
          </div>
          {hint ? (
            <div className="mt-1.5 break-words text-[10px] leading-snug text-muted sm:mt-2 sm:text-xs">{hint}</div>
          ) : null}
        </div>
        <span
          className={`inline-flex size-8 shrink-0 items-center justify-center border border-light-border/80 sm:size-11 ${iconBg} dark:border-dark-border/80`}
        >
          <Icon className="size-4 sm:size-5" strokeWidth={1.75} />
        </span>
      </div>
    </article>
  );
}

type DashboardPanelProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: "primary" | "success" | "warning" | "neutral";
};

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className = "",
  accent = "primary",
}: DashboardPanelProps) {
  return (
    <section
      className={`relative flex flex-col overflow-hidden border border-light-border bg-light-surface shadow-xs dark:border-dark-border dark:bg-dark-surface dark:shadow-dark-xs ${className}`}
    >
      <div className="flex flex-col gap-2 border-b border-light-border/80 bg-light-bg/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-dark-border/80 dark:bg-dark-bg/40">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-light-text sm:text-base dark:text-dark-text">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">{children}</div>
    </section>
  );
}

type MiniStatProps = {
  label: string;
  value: ReactNode;
  tone?: "default" | "warning" | "success" | "neutral" | "error";
};

export function DashboardMiniStat({
  label,
  value,
  tone = "default",
}: MiniStatProps) {
  const toneClass =
    tone === "error"
      ? "border-rose-400/20 bg-rose-500/5"
      : tone === "warning"
      ? "border-amber-400/20 bg-amber-500/5"
      : tone === "success"
        ? "border-emerald-400/20 bg-emerald-500/5"
        : tone === "neutral"
          ? "border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg"
          : "border-primary-500/15 bg-primary-500/5";

  return (
    <div
      className={`border px-3 py-2.5 transition hover:border-primary-500/20 ${toneClass}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p className="mt-1 font-semibold tabular-nums text-lg text-light-text dark:text-dark-text">
        {value}
      </p>
    </div>
  );
}

export function DashboardMiniStatGrid({
  children,
  cols = 3,
}: {
  children: ReactNode;
  cols?: 2 | 3 | 4 | 5 | 6;
}) {
  const colClass =
    cols === 6
      ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      : cols === 5
        ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        : cols === 4
          ? "sm:grid-cols-2 lg:grid-cols-4"
          : cols === 2
            ? "sm:grid-cols-2"
            : "sm:grid-cols-2 lg:grid-cols-3";

  return <div className={`grid gap-2 ${colClass}`}>{children}</div>;
}

export const DASHBOARD_CHART_TOOLTIP = {
  contentStyle: {
    background: "var(--surface)",
    border: "1px solid var(--surface-border)",
    borderRadius: 0,
    fontSize: 12,
    boxShadow: "var(--theme-shadow-sm)",
  },
  labelStyle: { color: "var(--muted)", fontWeight: 600 },
  itemStyle: { color: "var(--foreground)" },
};

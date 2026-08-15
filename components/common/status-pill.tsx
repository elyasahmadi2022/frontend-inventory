import clsx from "clsx";

export type StatusPillVariant = "success" | "warning" | "error" | "neutral";

const variantClasses: Record<StatusPillVariant, string> = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400",
  error:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400",
  neutral:
    "border-light-border bg-light-bg text-light-muted dark:border-dark-border dark:bg-dark-bg dark:text-dark-muted",
};

const dotClasses: Record<StatusPillVariant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  neutral: "bg-light-muted dark:bg-dark-muted",
};

type StatusPillProps = {
  label: string;
  variant?: StatusPillVariant;
  showDot?: boolean;
  className?: string;
};

export function moderationStatusVariant(
  status: string,
): StatusPillVariant {
  const normalized = status.toLowerCase();
  if (normalized === "verified") return "success";
  if (normalized === "rejected") return "error";
  if (normalized === "pending") return "warning";
  return "neutral";
}

export function moderationStatusLabel(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "verified") return "Approved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "pending") return "Pending";
  return status;
}

export default function StatusPill({
  label,
  variant = "neutral",
  showDot = true,
  className,
}: StatusPillProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-none border px-2 py-0.5 text-xs font-semibold leading-tight",
        variantClasses[variant],
        className,
      )}
    >
      {showDot ? (
        <span
          className={clsx("size-1.5 shrink-0 rounded-none", dotClasses[variant])}
          aria-hidden="true"
        />
      ) : null}
      {label}
    </span>
  );
}

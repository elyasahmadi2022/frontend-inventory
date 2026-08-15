type  statCardType =  {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    tone?: "default" | "success" | "warning" | "neutral";
  }
const  StatCard = ({
    label,
    value,
    icon,
    tone = "default",
  }: statCardType) => {
    const toneClass =
      tone === "success"
        ? "border-emerald-400/25 bg-emerald-50 dark:bg-emerald-500/10"
        : tone === "warning"
          ? "border-amber-400/25 bg-amber-50 dark:bg-amber-500/10"
          : tone === "neutral"
            ? "border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg"
            : "border-primary-500/20 bg-primary-50 dark:bg-primary-500/10";
  
    return (
      <div
        className={`flex items-center gap-3 border p-4 transition hover:shadow-sm dark:hover:shadow-dark-sm ${toneClass}`}
      >
        <span className="inline-flex size-10 shrink-0 items-center justify-center border border-light-border bg-light-surface text-primary-600 dark:border-dark-border dark:bg-dark-surface dark:text-primary-500">
          {icon}
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            {label}
          </p>
          <p className="mt-0.5 text-xl font-semibold text-light-text dark:text-dark-text">
            {value}
          </p>
        </div>
      </div>
    );
  }

  export default StatCard;
import Link from "next/link";
import { StatusPill } from "@/components/common";

type StoreModulePageProps = {
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    href: string;
  };
  items: string[];
};

export function StoreModulePage({
  title,
  description,
  primaryAction,
  items,
}: StoreModulePageProps) {
  return (
    <section className="space-y-3">
      <div className="border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-dark-surface sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3">
              <StatusPill label="Connected" variant="success" />
            </div>
            <h1 className="text-2xl font-semibold text-light-text dark:text-dark-text">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-light-muted dark:text-dark-muted">
              {description}
            </p>
          </div>
          {primaryAction ? (
            <Link
              href={primaryAction.href}
              className="inline-flex min-h-10 shrink-0 items-center justify-center border border-primary-500 bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:border-primary-600 hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
            >
              {primaryAction.label}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div
            key={item}
            className="border border-light-border bg-light-surface p-4 text-sm text-light-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

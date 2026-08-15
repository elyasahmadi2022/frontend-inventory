import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type DashboardTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
};

export function DashboardTable<T extends { id: string }>({
  columns,
  rows,
  emptyMessage = "No records to display.",
}: DashboardTableProps<T>) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">{emptyMessage}</p>
    );
  }

  return (
    <div className="scrollbar-thin -mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 bg-light-surface dark:bg-dark-surface">
          <tr className="border-b border-light-border dark:border-dark-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className={`border-b border-light-border/60 transition-colors hover:bg-primary-500/4 dark:border-dark-border/60 dark:hover:bg-primary-500/6 ${
                index % 2 === 1 ? "bg-light-bg/40 dark:bg-dark-bg/30" : ""
              }`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`whitespace-nowrap px-3 py-3 text-light-text dark:text-dark-text ${col.className ?? ""}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

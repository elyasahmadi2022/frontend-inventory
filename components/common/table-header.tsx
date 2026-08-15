import React from "react";
import clsx from "clsx";
import { CircleHelp } from "lucide-react";
import { tableThClass, tableTheadClass } from "@/components/common/table-styles";
import TooltipComponent from "@/context/TooltipContext";

export interface TableHeaderItem {
  title: React.ReactNode;
  icon?: React.ReactNode;
  tooltip?: string;
  hint?: string;
  align?: "start" | "center" | "end";
  className?: string;
  width?: string;
}

interface TableHeaderProps {
  headerData: TableHeaderItem[];
}

export default function TableHeader({ headerData }: TableHeaderProps) {
  return (
    <thead className={tableTheadClass}>
      <tr>
        {headerData.map((header, index) => {
          const tooltipText =
            header.tooltip?.trim() || header.hint?.trim() || null;

          return (
            <th
              key={index}
              style={
                header.width
                  ? {
                      width: header.width,
                      minWidth: header.width,
                      maxWidth: header.width,
                    }
                  : undefined
              }
              className={clsx(
                tableThClass,
                header.align === "center" && "text-center",
                header.align === "end" && "text-end",
                header.className,
              )}
            >
              <span
                className={clsx(
                  "inline-flex items-center gap-1.5",
                  header.align === "center" && "justify-center",
                  header.align === "end" && "justify-end",
                )}
              >
                {header.icon ? (
                  <span className="inline-flex shrink-0 text-light-muted opacity-85 dark:text-dark-muted [&_svg]:size-3.5">
                    {header.icon}
                  </span>
                ) : null}

                <span dir="auto" className="shrink-0 leading-tight [unicode-bidi:plaintext]">
                  {header.title}
                </span>

                {tooltipText ? (
                  <TooltipComponent content={tooltipText}>
                    <button
                      type="button"
                      className="inline-flex shrink-0 items-center rounded-none text-light-muted opacity-60 transition-colors hover:opacity-100 dark:text-dark-muted"
                      aria-label={tooltipText}
                    >
                      <CircleHelp className="size-3.5 shrink-0" aria-hidden />
                    </button>
                  </TooltipComponent>
                ) : null}
              </span>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

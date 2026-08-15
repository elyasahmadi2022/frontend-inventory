"use client";
import { type ReactNode } from "react";
import TableColumn from "@/components/common/table-column";
import TableRow from "@/components/common/table-row";
import Lottie from "lottie-react";
import No_Data from "@/components/lottie/No_Data_Found.json";
type DataTableEmptyStateProps = {
  colSpan: number;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export default function DataTableEmptyState({
  colSpan,
  title,
  description,
  action,
}: DataTableEmptyStateProps) {
  return (
    <TableRow disableHover>
      <TableColumn colSpan={colSpan} nowrap={false}>
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <div>
            <Lottie animationData={No_Data} loop={true} className=" h-60 w-60" autoplay={true} />
          </div>
          <p className="text-sm font-medium text-light-text dark:text-dark-text">
            {title}
          </p>
          {description ? (
            <p className="text-xs text-light-muted dark:text-dark-muted">
              {description}
            </p>
          ) : null}
          {action ? <div className="mt-2">{action}</div> : null}
        </div>
      </TableColumn>
    </TableRow>
  );
}

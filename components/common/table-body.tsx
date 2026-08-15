import React from "react";
import clsx from "clsx";
import { tableTbodyClass } from "@/components/common/table-styles";

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export default function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={clsx(tableTbodyClass, className)}>{children}</tbody>
  );
}

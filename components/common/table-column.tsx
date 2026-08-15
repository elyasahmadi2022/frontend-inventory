import React from "react";
import clsx from "clsx";
import { tableTdClass } from "@/components/common/table-styles";

interface TableColumnProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
  nowrap?: boolean;
  width?: string;
}

export default function TableColumn({
  children,
  className,
  colSpan,
  nowrap = true,
  width,
}: TableColumnProps) {
  const textLike = typeof children === "string" || typeof children === "number";

  return (
    <td
      colSpan={colSpan}
      style={
        width
          ? { width, minWidth: width, maxWidth: width }
          : undefined
      }
      className={clsx(
        tableTdClass,
        nowrap && "whitespace-nowrap",
        className,
      )}
    >
      {textLike ? (
        <span dir="auto" className="inline-block [unicode-bidi:plaintext]">
          {children}
        </span>
      ) : (
        children
      )}
    </td>
  );
}

import React from "react";
import clsx from "clsx";
import { tableTrClass, tableTrEmptyClass } from "@/components/common/table-styles";

interface TableRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disableHover?: boolean;
}

export default function TableRow({
  children,
  onClick,
  className,
  disableHover = false,
}: TableRowProps) {
  const interactive = typeof onClick === "function";

  return (
    <tr
      onClick={onClick}
      className={clsx(
        tableTrClass,
        disableHover && tableTrEmptyClass,
        interactive && "cursor-pointer",
        className,
      )}
    >
      {children}
    </tr>
  );
}

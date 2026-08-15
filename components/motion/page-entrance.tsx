"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { pageMotion } from "@/components/motion/motion-presets";

type PageEntranceProps = {
  children: ReactNode;
  className?: string;
};

// Subtle fade + lift when a route segment opens. Use with route template.tsx files.
export function PageEntrance({
  children,
  className = "flex min-h-0 flex-1 flex-col",
}: PageEntranceProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reduceMotion ? false : pageMotion.initial}
      animate={pageMotion.animate}
      transition={pageMotion.transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

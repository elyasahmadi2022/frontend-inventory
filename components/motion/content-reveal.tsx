"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { contentMotion } from "@/components/motion/motion-presets";

type ContentRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/**
 * Light mount animation for blocks inside a page (hero, cards, sections).
 */
export function ContentReveal({
  children,
  className,
  delay = 0,
}: ContentRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : contentMotion.initial}
      animate={contentMotion.animate}
      transition={{ ...contentMotion.transition, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

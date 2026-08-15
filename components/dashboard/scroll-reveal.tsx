"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { scrollRevealMotion } from "@/components/motion/motion-presets";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  amount?: number;
} & Pick<HTMLMotionProps<"div">, "style">;

const offsets = {
  up: { y: scrollRevealMotion.offset, x: 0 },
  down: { y: -scrollRevealMotion.offset, x: 0 },
  left: { x: scrollRevealMotion.offset, y: 0 },
  right: { x: -scrollRevealMotion.offset, y: 0 },
} as const;

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
  amount = 0.18,
  style,
}: ScrollRevealProps) {
  const offset = offsets[direction];
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, x: offset.x, y: offset.y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{
        duration: scrollRevealMotion.duration,
        delay,
        ease: scrollRevealMotion.ease,
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

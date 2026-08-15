export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const pageMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, ease: EASE_OUT },
} as const;

export const contentMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.34, ease: EASE_OUT },
} as const;

export const scrollRevealMotion = {
  offset: 14,
  duration: 0.45,
  ease: EASE_OUT,
} as const;

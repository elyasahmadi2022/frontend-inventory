type SmoothScrollOptions = {
  /** Pixels to leave above the target (e.g. sticky header). */
  offset?: number;
  /** Animation length in ms. */
  duration?: number;
};

function easeInOutCubic(progress: number): number {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - (-2 * progress + 2) ** 3 / 2;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Smooth eased scroll to an element. Falls back to native scroll when reduced motion is on.
 */
export function smoothScrollToElement(
  element: HTMLElement,
  { offset = 88, duration = 1000 }: SmoothScrollOptions = {},
): void {
  if (prefersReducedMotion()) {
    element.scrollIntoView({ behavior: "auto", block: "start" });
    return;
  }

  const startY = window.scrollY;
  const targetY =
    element.getBoundingClientRect().top + window.scrollY - offset;
  const distance = targetY - startY;

  if (Math.abs(distance) < 2) return;

  const startTime = performance.now();

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);

    window.scrollTo(0, startY + distance * eased);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}

export function smoothScrollToId(
  id: string,
  options?: SmoothScrollOptions,
): void {
  const element = document.getElementById(id);
  if (element) smoothScrollToElement(element, options);
}

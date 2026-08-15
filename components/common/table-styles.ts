/** Shared Tailwind class groups for the data table primitives. */

import {
  interactiveTabActiveClass,
  interactiveTabClass,
} from "@/components/common/interactive-list-styles";

export const tableShellClass =
  "min-w-0 max-w-full overflow-hidden rounded-none border border-light-border bg-light-surface shadow-xs dark:border-dark-border dark:bg-dark-surface dark:shadow-dark-xs";

export const tableScrollClass =
  "min-w-0 max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] scrollbar-hidden";

export const tableToolbarClass =
  "flex flex-col gap-3 border-b border-light-border bg-light-bg px-4 py-3 dark:border-dark-border dark:bg-dark-bg";

export const tableToolbarTabsClass =
  "relative flex w-full min-w-0 flex-wrap content-start gap-1 rounded-none bg-light-border/60 p-1 dark:bg-dark-border/40";

export const tableToolbarTabClass = interactiveTabClass;

export const tableToolbarTabActiveClass = interactiveTabActiveClass;

export const tableToolbarTabIndicatorClass =
  "pointer-events-none absolute left-0 top-0 rounded-none bg-primary-500 shadow-xs transition-[transform,width,height] duration-300 ease-out dark:bg-primary-500 dark:shadow-dark-xs";

export const tableTheadClass = "bg-light-bg dark:bg-dark-bg";

export const tableThClass =
  "overflow-visible border-b border-light-border px-4 py-2.5 text-start align-middle text-[11px] font-semibold tracking-wide whitespace-nowrap text-light-muted dark:border-dark-border dark:text-dark-muted [font-family:var(--font-locale)]";

export const tableTbodyClass =
  "bg-light-surface dark:bg-dark-surface [&>tr>td]:border-b [&>tr>td]:border-light-border dark:[&>tr>td]:border-dark-border [&>tr:last-child>td]:border-b-0";

export const tableTrClass =
  "bg-light-surface transition-colors hover:bg-light-bg dark:bg-dark-surface dark:hover:bg-dark-bg";

export const tableTrEmptyClass =
  "hover:bg-light-surface dark:hover:bg-dark-surface";

export const tableTdClass =
  "px-4 py-3 align-middle text-[13px] leading-snug text-light-text dark:text-dark-text [font-family:var(--font-locale)]";

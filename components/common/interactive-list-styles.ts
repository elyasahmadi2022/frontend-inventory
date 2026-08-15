import { joinClasses } from "@/components/common/form-control";

/** Dropdown / popover panel — white in light theme, dark surface in dark theme. */
export const interactiveDropdownPanelClass =
  "overflow-hidden rounded-none border border-light-border bg-white p-1.5 text-light-text shadow-lg outline-none dark:border-dark-border dark:bg-dark-surface dark:text-dark-text dark:shadow-dark-lg";

/**
 * Shared full-row primary hover for select options, dropdown menus,
 * account menus, table toolbars, and operation panels.
 */
export const interactiveListRowClass =
  "group flex w-full cursor-pointer select-none items-center gap-2.5 rounded-none bg-transparent px-2.5 py-2 text-sm text-light-text outline-none transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-primary-500 hover:text-white focus-visible:bg-primary-500 focus-visible:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-primary-500 data-[highlighted]:text-white dark:text-dark-text dark:hover:bg-primary-500 dark:focus-visible:bg-primary-500 dark:data-[highlighted]:bg-primary-500";

/** Selected / checked at rest — same weight as other rows, black/white text. */
export const interactiveListRowSelectedClass =
  "font-normal text-light-text hover:bg-primary-500 hover:text-white dark:text-dark-text dark:hover:bg-primary-500 dark:hover:text-white data-[state=checked]:bg-transparent data-[state=checked]:font-normal data-[state=checked]:text-light-text dark:data-[state=checked]:bg-transparent dark:data-[state=checked]:text-dark-text data-[highlighted]:data-[state=checked]:bg-primary-500 data-[highlighted]:data-[state=checked]:text-white";

export const interactiveListIconClass =
  "shrink-0 text-current opacity-80 transition-colors group-hover:opacity-100 group-hover:text-white group-focus-visible:text-white group-data-[highlighted]:text-white group-data-[highlighted]:opacity-100 [&_svg]:size-[18px]";

export const interactiveListMetaClass =
  "ms-auto shrink-0 text-xs text-light-muted transition-colors group-hover:text-white/85 group-focus-visible:text-white/85 group-data-[highlighted]:text-white/85 dark:text-dark-muted";

export const interactiveListDescriptionClass =
  "mt-0.5 block truncate text-xs font-normal opacity-55 group-hover:opacity-90 group-hover:text-white/90 group-focus-visible:text-white/90 group-data-[highlighted]:text-white/90";

export const interactiveListCheckboxClass =
  "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-none border border-current text-current transition-colors group-hover:border-white group-hover:bg-white/15 group-hover:text-white group-focus-visible:border-white group-focus-visible:bg-white/15 group-data-[highlighted]:border-white group-data-[highlighted]:bg-white/15 data-[state=checked]:border-primary-500 data-[state=checked]:bg-primary-500 data-[state=checked]:text-white group-hover:data-[state=checked]:border-white group-hover:data-[state=checked]:bg-white group-hover:data-[state=checked]:text-primary-500 group-data-[highlighted]:data-[state=checked]:border-white group-data-[highlighted]:data-[state=checked]:bg-white group-data-[highlighted]:data-[state=checked]:text-primary-500";

export const interactiveListIndicatorClass =
  "absolute start-3 text-current transition-colors text-light-text group-data-[highlighted]:text-white dark:text-dark-text dark:group-data-[highlighted]:text-white";

/** Compact icon trigger — white / dark surface at rest, primary-500 on hover & open. */
export const interactiveTriggerCompactClass =
  "cursor-pointer rounded-none border border-light-border bg-white text-light-muted transition-all duration-200 ease-out hover:border-primary-500 hover:bg-primary-500 hover:text-white focus-visible:ring-2 focus-visible:ring-primary-500/25 data-[state=open]:border-primary-500 data-[state=open]:bg-primary-500 data-[state=open]:text-white dark:border-dark-border dark:bg-dark-surface dark:text-dark-muted dark:hover:border-primary-500 dark:hover:bg-primary-500 dark:hover:text-white dark:data-[state=open]:border-primary-500 dark:data-[state=open]:bg-primary-500 dark:data-[state=open]:text-white";

/** Standard text trigger with optional arrow. */
export const interactiveTriggerClass =
  "rounded-none border border-light-border bg-white text-sm font-medium text-light-text transition-all duration-200 ease-out hover:border-primary-500 hover:bg-primary-500 hover:text-white data-[state=open]:border-primary-500 data-[state=open]:bg-primary-500 data-[state=open]:text-white dark:border-dark-border dark:bg-dark-surface dark:text-dark-text dark:hover:border-primary-500 dark:hover:bg-primary-500 dark:hover:text-white dark:data-[state=open]:border-primary-500 dark:data-[state=open]:bg-primary-500 dark:data-[state=open]:text-white";

/** Account / avatar triggers — no primary fill on hover or open. */
export const interactiveTriggerNeutralCompactClass =
  "cursor-pointer rounded-none border border-light-border bg-light-bg text-light-text transition-colors duration-200 ease-out hover:border-light-border hover:bg-light-bg focus-visible:ring-2 focus-visible:ring-primary-500/25 data-[state=open]:border-light-border data-[state=open]:bg-light-bg dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:hover:border-dark-border dark:hover:bg-dark-bg dark:data-[state=open]:border-dark-border dark:data-[state=open]:bg-dark-bg";

export const interactiveTriggerNeutralClass =
  "rounded-none border border-light-border bg-light-bg text-sm font-medium text-light-text transition-colors duration-200 ease-out hover:border-light-border hover:bg-light-bg data-[state=open]:border-light-border data-[state=open]:bg-light-bg dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:hover:border-dark-border dark:hover:bg-dark-bg dark:data-[state=open]:border-dark-border dark:data-[state=open]:bg-dark-bg";

/** Segmented toolbar tab — inactive state. */
export const interactiveTabClass =
  "relative z-[1] inline-flex items-center gap-1.5 rounded-none bg-transparent px-2.5 py-1.5 text-[11px] font-semibold text-light-muted transition-colors duration-200 hover:bg-primary-500 hover:text-white dark:text-dark-muted dark:hover:bg-primary-500 dark:hover:text-white";

/** Active tab sits on primary-500 indicator — white label in both themes. */
export const interactiveTabActiveClass = "text-white dark:text-white !bg-primary-500";

export const interactiveSelectOptionRowClass = joinClasses(
  interactiveListRowClass,
  "items-center gap-2.5 px-3",
);

export const interactiveSelectOptionRadixItemClass = joinClasses(
  interactiveSelectOptionRowClass,
  "relative cursor-default select-none py-2 pe-9 ps-3",
  interactiveListRowSelectedClass,
);

export const interactiveDropdownItemClass = joinClasses(
  interactiveListRowClass,
  "min-h-10 gap-3",
);

export const interactiveDropdownChoiceItemClass = joinClasses(
  interactiveDropdownItemClass,
  "relative ps-9",
  interactiveListRowSelectedClass,
);

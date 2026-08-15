"use client";

import Link, { type LinkProps } from "next/link";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from "react";
import { DropdownMenu } from "radix-ui";
import { joinClasses } from "@/components/common/form-control";
import {
  interactiveDropdownChoiceItemClass,
  interactiveDropdownItemClass,
  interactiveDropdownPanelClass,
  interactiveListIconClass,
  interactiveListIndicatorClass,
  interactiveListMetaClass,
  interactiveTriggerClass,
  interactiveTriggerCompactClass,
  interactiveTriggerNeutralClass,
  interactiveTriggerNeutralCompactClass,
} from "@/components/common/interactive-list-styles";

type DropdownMenuRootProps = ComponentPropsWithoutRef<typeof DropdownMenu.Root>;

/** Default `modal={false}` avoids react-remove-scroll padding that shifts the layout when a menu opens. */
export function DropdownMenuRoot({
  modal = false,
  ...props
}: DropdownMenuRootProps) {
  return <DropdownMenu.Root modal={modal} {...props} />;
}
export const DropdownMenuGroup = DropdownMenu.Group;
export const DropdownRadioGroup = DropdownMenu.RadioGroup;
export const DropdownSub = DropdownMenu.Sub;

function ChevronIcon({ direction = "down" }: { direction?: "down" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={joinClasses(
        "transition-transform duration-200",
        direction === "right" ? "-rotate-90 rtl:rotate-90" : undefined,
      )}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

type DropdownTriggerProps = ComponentPropsWithoutRef<
  typeof DropdownMenu.Trigger
> & {
  compact?: boolean;
  icon?: ReactNode;
  showArrow?: boolean;
  /** Primary fill on hover (default) or neutral surface for account/avatar triggers. */
  tone?: "primary" | "neutral";
};

export const DropdownTrigger = forwardRef<
  ElementRef<typeof DropdownMenu.Trigger>,
  DropdownTriggerProps
>(function DropdownTrigger(
  {
    children,
    className,
    compact = false,
    icon,
    showArrow = true,
    tone = "primary",
    ...props
  },
  ref,
) {
  const triggerSurfaceClass =
    tone === "neutral"
      ? compact
        ? interactiveTriggerNeutralCompactClass
        : interactiveTriggerNeutralClass
      : compact
        ? interactiveTriggerCompactClass
        : interactiveTriggerClass;

  return (
    <DropdownMenu.Trigger asChild>
      <button
        ref={ref}
        type="button"
        className={joinClasses(
          "group/trigger inline-flex items-center gap-2 border outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 disabled:cursor-not-allowed disabled:opacity-50",
          compact
            ? joinClasses("h-10 w-10 justify-center p-0", triggerSurfaceClass)
            : joinClasses("min-h-10 px-3.5 py-2", triggerSurfaceClass),
          className,
        )}
        {...props}
      >
        {icon ? (
          <span className={interactiveListIconClass}>{icon}</span>
        ) : null}
        {children ? (
          compact ? (
            children
          ) : (
            <span className="min-w-0 flex-1 truncate">{children}</span>
          )
        ) : null}
        {showArrow ? (
          <span className="shrink-0 text-current opacity-70 transition-transform duration-200 group-data-[state=open]/trigger:rotate-180">
            <ChevronIcon />
          </span>
        ) : null}
      </button>
    </DropdownMenu.Trigger>
  );
});

type DropdownContentProps = ComponentPropsWithoutRef<
  typeof DropdownMenu.Content
>;

export const DropdownContent = forwardRef<
  ElementRef<typeof DropdownMenu.Content>,
  DropdownContentProps
>(function DropdownContent(
  { align = "start", className, sideOffset = 6, ...props },
  ref,
) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={12}
        className={joinClasses(
          "z-[1100] min-w-56",
          interactiveDropdownPanelClass,
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          className,
        )}
        {...props}
      />
    </DropdownMenu.Portal>
  );
});

type DropdownItemVariant = "default" | "danger" | "success" | "warning";

const itemVariantClasses: Record<DropdownItemVariant, string> = {
  default: "text-light-text dark:text-dark-text",
  danger: "text-red-600 dark:text-red-400",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
};

type DropdownItemProps = ComponentPropsWithoutRef<typeof DropdownMenu.Item> & {
  data?: ReactNode;
  icon?: ReactNode;
  variant?: DropdownItemVariant;
};

export const DropdownItem = forwardRef<
  ElementRef<typeof DropdownMenu.Item>,
  DropdownItemProps
>(function DropdownItem(
  { children, className, data, icon, variant = "default", ...props },
  ref,
) {
  return (
    <DropdownMenu.Item
      ref={ref}
      className={joinClasses(
        interactiveDropdownItemClass,
        itemVariantClasses[variant],
        className,
      )}
      {...props}
    >
      {icon ? <span className={interactiveListIconClass}>{icon}</span> : null}
      <span className="min-w-0 flex-1">{children}</span>
      {data ? (
        <span className={interactiveListMetaClass}>{data}</span>
      ) : null}
    </DropdownMenu.Item>
  );
});

type DropdownLinkItemProps = Omit<LinkProps, "href"> & {
  children: ReactNode;
  className?: string;
  data?: ReactNode;
  href: LinkProps["href"];
  icon?: ReactNode;
  onSelect?: () => void;
  variant?: DropdownItemVariant;
};

export function DropdownLinkItem({
  children,
  className,
  data,
  href,
  icon,
  onSelect,
  variant = "default",
  ...linkProps
}: DropdownLinkItemProps) {
  return (
    <DropdownMenu.Item asChild onSelect={onSelect}>
      <Link
        href={href}
        className={joinClasses(
          interactiveDropdownItemClass,
          itemVariantClasses[variant],
          className,
        )}
        {...linkProps}
      >
        {icon ? <span className={interactiveListIconClass}>{icon}</span> : null}
        <span className="min-w-0 flex-1">{children}</span>
        {data ? (
          <span className={interactiveListMetaClass}>{data}</span>
        ) : null}
      </Link>
    </DropdownMenu.Item>
  );
}

type DropdownCheckboxItemProps = ComponentPropsWithoutRef<
  typeof DropdownMenu.CheckboxItem
>;

export const DropdownCheckboxItem = forwardRef<
  ElementRef<typeof DropdownMenu.CheckboxItem>,
  DropdownCheckboxItemProps
>(function DropdownCheckboxItem({ children, className, ...props }, ref) {
  return (
    <DropdownMenu.CheckboxItem
      ref={ref}
      className={joinClasses(interactiveDropdownChoiceItemClass, className)}
      {...props}
    >
      <DropdownMenu.ItemIndicator className={interactiveListIndicatorClass}>
        <CheckIcon />
      </DropdownMenu.ItemIndicator>
      {children}
    </DropdownMenu.CheckboxItem>
  );
});

type DropdownRadioItemProps = ComponentPropsWithoutRef<
  typeof DropdownMenu.RadioItem
> & {
  icon?: ReactNode;
};

export const DropdownRadioItem = forwardRef<
  ElementRef<typeof DropdownMenu.RadioItem>,
  DropdownRadioItemProps
>(function DropdownRadioItem({ children, className, icon, ...props }, ref) {
  return (
    <DropdownMenu.RadioItem
      ref={ref}
      className={joinClasses(interactiveDropdownChoiceItemClass, className)}
      {...props}
    >
      <DropdownMenu.ItemIndicator className={interactiveListIndicatorClass}>
        <CheckIcon />
      </DropdownMenu.ItemIndicator>
      {icon ? <span className={interactiveListIconClass}>{icon}</span> : null}
      <span className="min-w-0 flex-1">{children}</span>
    </DropdownMenu.RadioItem>
  );
});

type DropdownSubTriggerProps = ComponentPropsWithoutRef<
  typeof DropdownMenu.SubTrigger
> & {
  data?: ReactNode;
  icon?: ReactNode;
};

export const DropdownSubTrigger = forwardRef<
  ElementRef<typeof DropdownMenu.SubTrigger>,
  DropdownSubTriggerProps
>(function DropdownSubTrigger(
  { children, className, data, icon, ...props },
  ref,
) {
  return (
    <DropdownMenu.SubTrigger
      ref={ref}
      className={joinClasses(interactiveDropdownItemClass, className)}
      {...props}
    >
      {icon ? <span className={interactiveListIconClass}>{icon}</span> : null}
      <span className="min-w-0 flex-1">{children}</span>
      {data ? <span className={interactiveListMetaClass}>{data}</span> : null}
      <span
        className={joinClasses(
          interactiveListMetaClass,
          "ms-0 group-data-[highlighted]:text-white",
        )}
      >
        <ChevronIcon direction="right" />
      </span>
    </DropdownMenu.SubTrigger>
  );
});

type DropdownSubContentProps = ComponentPropsWithoutRef<
  typeof DropdownMenu.SubContent
>;

export const DropdownSubContent = forwardRef<
  ElementRef<typeof DropdownMenu.SubContent>,
  DropdownSubContentProps
>(function DropdownSubContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.SubContent
        ref={ref}
        sideOffset={sideOffset}
        collisionPadding={12}
        className={joinClasses(
          "z-[1100] min-w-48",
          interactiveDropdownPanelClass,
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          className,
        )}
        {...props}
      />
    </DropdownMenu.Portal>
  );
});

type DropdownLabelProps = ComponentPropsWithoutRef<typeof DropdownMenu.Label>;

export const DropdownLabel = forwardRef<
  ElementRef<typeof DropdownMenu.Label>,
  DropdownLabelProps
>(function DropdownLabel({ className, ...props }, ref) {
  return (
    <DropdownMenu.Label
      ref={ref}
      className={joinClasses(
        "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-light-muted dark:text-dark-muted",
        className,
      )}
      {...props}
    />
  );
});

type DropdownSeparatorProps = ComponentPropsWithoutRef<
  typeof DropdownMenu.Separator
>;

export const DropdownSeparator = forwardRef<
  ElementRef<typeof DropdownMenu.Separator>,
  DropdownSeparatorProps
>(function DropdownSeparator({ className, ...props }, ref) {
  return (
    <DropdownMenu.Separator
      ref={ref}
      className={joinClasses(
        "my-1 h-px bg-light-border dark:bg-dark-border",
        className,
      )}
      {...props}
    />
  );
});

export function DropdownShortcut({
  className,
  ...props
}: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={joinClasses(interactiveListMetaClass, className)}
      {...props}
    />
  );
}

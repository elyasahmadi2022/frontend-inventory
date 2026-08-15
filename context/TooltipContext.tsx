"use client";

import * as React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cn } from "@/utils/utile";

interface AppTooltipProviderProps {
  children: React.ReactNode;
}

/** Provide once at app root */
export function AppTooltipProvider({
  children,
}: AppTooltipProviderProps) {
  return (
    <Tooltip.Provider delayDuration={350} skipDelayDuration={120}>
      {children}
    </Tooltip.Provider>
  );
}

interface TooltipComponentProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  className?: string;
}

const TooltipComponent = React.forwardRef<
  HTMLDivElement,
  TooltipComponentProps
>(
  (
    {
      content,
      children,
      side = "top",
      sideOffset = 5,
      className,
    },
    ref,
  ) => {
    return (
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {children}
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content
            ref={ref}
            side={side}
            sideOffset={sideOffset}
            className={cn(
              "z-10050 max-w-xs select-none rounded-none border border-light-border  bg-light-bg dark:border-dark-border dark:bg-dark-bg  px-3 py-3 text-xs leading-snug text-(--color-light-text-primary) shadow-lg outline-none  dark:text-white",
              "will-change-[transform,opacity] data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-[instant-open]:animate-in data-[instant-open]:fade-in-0 data-[instant-open]:zoom-in-95",
              className,
            )}
          >
            {content}
            <Tooltip.Arrow className=" fill-light-bg dark:fill-dark-bg" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    );
  },
);

TooltipComponent.displayName = "TooltipComponent";

export default TooltipComponent;
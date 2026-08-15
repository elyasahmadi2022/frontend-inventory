"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  tableToolbarTabActiveClass,
  tableToolbarTabClass,
  tableToolbarTabIndicatorClass,
  tableToolbarTabsClass,
} from "@/components/common/table-styles";
import type { TableViewTab } from "@/components/common/table-tool-bar";

type TableViewTabsProps = {
  tabs: TableViewTab[];
  value: string;
  onValueChange?: (value: string) => void;
  className?: string;
  tabClassName?: string;
};

export default function TableViewTabs({
  tabs,
  value,
  onValueChange,
  className,
  tabClassName,
}: TableViewTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const [indicator, setIndicator] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const measureActiveTab = useCallback(() => {
    const activeTab = tabRefs.current.get(value);
    if (!activeTab) return;
    setIndicator({
      left: activeTab.offsetLeft,
      top: activeTab.offsetTop,
      width: activeTab.offsetWidth,
      height: activeTab.offsetHeight,
    });
  }, [value]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    measureActiveTab();
  }, [measureActiveTab, tabs]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      measureActiveTab();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [measureActiveTab]);

  return (
    <div
      ref={containerRef}
      className={clsx(tableToolbarTabsClass, "shrink-0", className)}
      role="tablist"
    >
      {indicator.width > 0 ? (
        <span
          aria-hidden
          className={tableToolbarTabIndicatorClass}
          style={{
            width: indicator.width,
            height: indicator.height,
            transform: `translate(${indicator.left}px, ${indicator.top}px)`,
          }}
        />
      ) : null}
      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={(node) => {
            if (node) tabRefs.current.set(tab.id, node);
            else tabRefs.current.delete(tab.id);
          }}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className={clsx(
            tableToolbarTabClass,
            "max-w-full min-w-fit justify-center whitespace-nowrap",
            value === tab.id && tableToolbarTabActiveClass,
            tabClassName,
          )}
          onClick={() => onValueChange?.(tab.id)}
        >
          {tab.icon ? (
            <span
              className={clsx(
                "inline-flex shrink-0 opacity-90 [&_svg]:size-3.5",
                value === tab.id ? "text-white" : "text-current",
              )}
            >
              {tab.icon}
            </span>
          ) : null}
          <span className="truncate">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

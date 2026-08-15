"use client";

import { useEffect, useRef } from "react";

export function useClickOutSide<T extends HTMLElement>(
  handler: () => void,
  listenerCapturing = true
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    function clickHandler(event: MouseEvent) {
      const target = event.target as Node;

      if (ref.current && !ref.current.contains(target)) {
        handler();
      }
    }

    document.addEventListener(
      "click",
      clickHandler,
      listenerCapturing
    );

    return () => {
      document.removeEventListener(
        "click",
        clickHandler,
        listenerCapturing
      );
    };
  }, [handler, listenerCapturing]);

  return ref;
}
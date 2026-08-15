"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import clsx from "clsx";
import { useClickOutSide } from "@/hooks/use-click-out-side";

type ModalContextType = {
  openName: string;
  anchorRect: DOMRect | null;
  open: (name: string, anchor: DOMRect) => void;
  close: () => void;
};

export type TableMenuModalChildProps = {
  close?: () => void;
};

type TableMenuModalProps = {
  children: ReactNode;
};

type OpenProps = {
  children: ReactElement<{ onClick?: React.MouseEventHandler<HTMLElement> }>;
  opens: string;
};

type WindowAlign = "start" | "end";

type WindowProps = {
  children: ReactNode;
  name: string;
  /** Popover opens beside the trigger; modal centers on screen. */
  mode?: "popover" | "modal";
  align?: WindowAlign;
  className?: string;
};

const ModalContext = createContext<ModalContextType | null>(null);

function useModalContext() {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error(
      "TableMenuModal components must be used within TableMenuModal",
    );
  }

  return context;
}

const popoverVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: -4,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.16,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -4,
    transition: {
      duration: 0.12,
      ease: "easeIn",
    },
  },
};

const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: "easeIn",
    },
  },
};

function Open({ children, opens: openWindowName }: OpenProps) {
  const { open, openName, close } = useModalContext();

  return React.cloneElement(children, {
    onClick: (event) => {
      children.props.onClick?.(event);
      if (event.defaultPrevented) return;

      const target = event.currentTarget as HTMLElement;
      if (openName === openWindowName) {
        close();
        return;
      }

      open(openWindowName, target.getBoundingClientRect());
    },
  });
}

function PopoverWindow({
  children,
  name,
  align = "end",
  className,
}: Omit<WindowProps, "mode">) {
  const { openName, anchorRect, close } = useModalContext();
  const ref = useClickOutSide<HTMLDivElement>(close);
  const isOpen = openName === name && anchorRect != null;

  if (typeof document === "undefined" || !isOpen) {
    return null;
  }

  const panelStyle: CSSProperties = {
    position: "fixed",
    top: anchorRect.bottom + 6,
    zIndex: 99999,
    ...(align === "end"
      ? { right: Math.max(8, window.innerWidth - anchorRect.right) }
      : { left: Math.max(8, anchorRect.left) }),
  };

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          ref={ref}
          style={panelStyle}
          variants={popoverVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          className={clsx(
            "max-h-[min(70vh,24rem)] overflow-y-auto",
            align === "end" ? "origin-top-right" : "origin-top-left",
            className,
          )}
        >
          {React.isValidElement(children)
            ? React.cloneElement(
                children as ReactElement<TableMenuModalChildProps>,
                { close },
              )
            : children}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function ModalWindow({ children, name, className }: Omit<WindowProps, "mode" | "align">) {
  const { openName, close } = useModalContext();
  const ref = useClickOutSide<HTMLDivElement>(close);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {openName === name ? (
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="pointer-events-auto fixed inset-0 z-[99999] flex min-h-screen items-center justify-center bg-light-surface/40 backdrop-blur-xs dark:bg-dark-bg/50"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              close();
            }
          }}
        >
          <div
            ref={ref}
            className={clsx(
              "pointer-events-auto max-h-[90vh] overflow-y-auto",
              className,
            )}
            onClick={(event) => event.stopPropagation()}
          >
            {React.isValidElement(children)
              ? React.cloneElement(
                  children as ReactElement<TableMenuModalChildProps>,
                  { close },
                )
              : children}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function Window({
  children,
  name,
  mode = "popover",
  align = "end",
  className,
}: WindowProps) {
  if (mode === "modal") {
    return (
      <ModalWindow name={name} className={className}>
        {children}
      </ModalWindow>
    );
  }

  return (
    <PopoverWindow name={name} align={align} className={className}>
      {children}
    </PopoverWindow>
  );
}

type TableMenuModalComponent = React.FC<TableMenuModalProps> & {
  Open: typeof Open;
  Window: typeof Window;
};

const TableMenuModal: TableMenuModalComponent = ({ children }) => {
  const [openName, setOpenName] = useState("");
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const close = () => {
    setOpenName("");
    setAnchorRect(null);
  };

  const open = (name: string, anchor: DOMRect) => {
    setOpenName(name);
    setAnchorRect(anchor);
  };

  return (
    <ModalContext.Provider
      value={{
        openName,
        anchorRect,
        open,
        close,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

TableMenuModal.Open = Open;
TableMenuModal.Window = Window;

export default TableMenuModal;

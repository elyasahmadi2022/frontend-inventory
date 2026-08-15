"use client";

import { Switch } from "radix-ui";

type ToggleSwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id: string;
  label?: string;
  "aria-label"?: string;
  disabled?: boolean;
};

export function ToggleSwitch({
  checked,
  onCheckedChange,
  id,
  label,
  "aria-label": ariaLabel,
  disabled = false,
}: ToggleSwitchProps) {
  const thumbLeft = checked ? "22px" : "2px";

  return (
    <div className="inline-flex items-center gap-3 rtl:flex-row-reverse">
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={ariaLabel ?? label}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-none border border-light-border bg-light-bg transition data-[state=checked]:border-primary-500 data-[state=checked]:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:bg-dark-bg dark:data-[state=checked]:border-primary-500 dark:data-[state=checked]:bg-primary-500"
      >
        <Switch.Thumb
          className="pointer-events-none absolute top-0.5 block size-5 rounded-none bg-white shadow-sm ring-0 transition-[left] duration-200"
          style={{ left: thumbLeft }}
        />
      </Switch.Root>
      {label ? (
        <label
          htmlFor={id}
          className="cursor-pointer text-start text-sm font-medium text-light-text dark:text-dark-text"
        >
          {label}
        </label>
      ) : null}
    </div>
  );
}

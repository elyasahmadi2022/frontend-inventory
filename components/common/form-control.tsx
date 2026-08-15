import type { ReactNode } from "react";
import { Label } from "radix-ui";

export type FormControlTone = "dark" | "light";

type FieldFrameProps = {
  children: ReactNode;
  className?: string;
  description?: string;
  descriptionId?: string;
  error?: string;
  errorId?: string;
  label?: string;
  labelFor?: string;
  required?: boolean;
  tone?: FormControlTone;
};

export const fieldToneClasses: Record<
  FormControlTone,
  {
    control: string;
    description: string;
    label: string;
    panel: string;
    placeholder: string;
  }
> = {
  dark: {
    control:
      "border-dark-border bg-dark-surface text-dark-text placeholder:text-dark-muted",
    description: "text-dark-muted",
    label: "text-dark-text",
    panel: "border-dark-border bg-dark-surface text-dark-text",
    placeholder: "text-dark-muted",
  },
  light: {
    control:
      "border-light-border bg-light-surface text-light-text placeholder:text-light-muted dark:border-dark-border dark:bg-dark-surface dark:text-dark-text dark:placeholder:text-dark-muted",
    description: "text-light-muted dark:text-dark-muted",
    label: "text-light-text dark:text-dark-text",
    panel:
      "border-light-border bg-light-surface text-light-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text",
    placeholder: "text-light-muted dark:text-dark-muted",
  },
};

export const baseControlClass =
  "min-h-11 w-full rounded-none border px-3.5 text-sm shadow-xs outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-primary-500 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-inherit";

export function joinClasses(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}

export function FieldFrame({
  children,
  className,
  description,
  descriptionId,
  error,
  errorId,
  label,
  labelFor,
  required,
  tone = "dark",
}: FieldFrameProps) {
  const styles = fieldToneClasses[tone];

  return (
    <div className={joinClasses("w-full", className)}>
      {label ? (
        <Label.Root
          htmlFor={labelFor}
          className={joinClasses(
            "mb-1.5 block text-xs font-semibold uppercase tracking-wide",
            styles.label,
          )}
        >
          {label}
          {required ? (
            <span className="ml-1 text-primary-500" aria-hidden="true">
              *
            </span>
          ) : null}
        </Label.Root>
      ) : null}

      {children}

      {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : description ? (
        <p
          id={descriptionId}
          className={joinClasses("mt-1.5 text-xs", styles.description)}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import {
  forwardRef,
  useId,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import {
  baseControlClass,
  FieldFrame,
  fieldToneClasses,
  joinClasses,
  type FormControlTone,
} from "@/components/common/form-control";

function normalizeLocalizedNumber(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[٫،]/g, ".")
    .replace(/[٬,]/g, "")
    .replace(/−/g, "-");
}

export type InputFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> & {
  containerClassName?: string;
  description?: string;
  endIcon?: ReactNode;
  error?: string;
  label?: string;
  startIcon?: ReactNode;
  tone?: FormControlTone;
};

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  function InputField(
    {
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      className,
      containerClassName,
      description,
      disabled,
      endIcon,
      error,
      id,
      inputMode,
      label,
      onChange,
      required,
      startIcon,
      tone = "dark",
      type = "text",
      ...inputProps
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? `input-${generatedId}`;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = ariaDescribedBy ?? (error ? errorId : descriptionId);
    const styles = fieldToneClasses[tone];
    const isNumberInput = type === "number";
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (isNumberInput) {
        const normalized = normalizeLocalizedNumber(event.currentTarget.value);
        if (normalized !== event.currentTarget.value) {
          event.currentTarget.value = normalized;
        }
      }
      onChange?.(event);
    };

    return (
      <FieldFrame
        className={containerClassName}
        description={description}
        descriptionId={descriptionId}
        error={error}
        errorId={errorId}
        label={label}
        labelFor={inputId}
        required={required}
        tone={tone}
      >
        <div
          className={joinClasses(
            baseControlClass,
            "flex items-center gap-2",
            styles.control,
            error && "border-red-500/70 focus-within:border-red-500",
            disabled && "cursor-not-allowed opacity-60",
            className,
          )}
        >
          {startIcon ? (
            <span className="shrink-0 opacity-70" aria-hidden="true">
              {startIcon}
            </span>
          ) : null}
          <input
            {...inputProps}
            ref={ref}
            id={inputId}
            type={isNumberInput ? "text" : type}
            inputMode={isNumberInput ? (inputMode ?? "decimal") : inputMode}
            onChange={handleChange}
            required={required}
            disabled={disabled}
            aria-invalid={ariaInvalid ?? Boolean(error)}
            aria-describedby={describedBy}
            className="min-w-0 flex-1 bg-transparent  py-2.5 outline-none placeholder:inherit"
          />
          {endIcon ? (
            <span className="shrink-0 opacity-70">{endIcon}</span>
          ) : null}
        </div>
      </FieldFrame>
    );
  },
);

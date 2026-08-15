"use client";

import {
  forwardRef,
  useId,
  type TextareaHTMLAttributes,
} from "react";
import {
  baseControlClass,
  FieldFrame,
  fieldToneClasses,
  joinClasses,
  type FormControlTone,
} from "@/components/common/form-control";

export type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  containerClassName?: string;
  description?: string;
  error?: string;
  label?: string;
  tone?: FormControlTone;
};

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField(
    {
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      className,
      containerClassName,
      description,
      disabled,
      error,
      id,
      label,
      required,
      rows = 4,
      tone = "dark",
      ...textareaProps
    },
    ref,
  ) {
    const generatedId = useId();
    const textareaId = id ?? `textarea-${generatedId}`;
    const descriptionId = description ? `${textareaId}-description` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;
    const describedBy = ariaDescribedBy ?? (error ? errorId : descriptionId);
    const styles = fieldToneClasses[tone];

    return (
      <FieldFrame
        className={containerClassName}
        description={description}
        descriptionId={descriptionId}
        error={error}
        errorId={errorId}
        label={label}
        labelFor={textareaId}
        required={required}
        tone={tone}
      >
        <textarea
          {...textareaProps}
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          disabled={disabled}
          aria-invalid={ariaInvalid ?? Boolean(error)}
          aria-describedby={describedBy}
          className={joinClasses(
            baseControlClass,
            "min-h-28 resize-y py-3",
            styles.control,
            error && "border-red-500/70 focus:border-red-500",
            disabled && "cursor-not-allowed opacity-60",
            className,
          )}
        />
      </FieldFrame>
    );
  },
);

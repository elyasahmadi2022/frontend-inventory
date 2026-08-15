"use client";

import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  TextareaField,
  type TextareaFieldProps,
} from "@/components/common/textarea-field";

type FormTextareaFieldProps<T extends FieldValues> = Omit<
  TextareaFieldProps,
  "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "ref"
> & {
  control: Control<T>;
  name: FieldPath<T>;
};

export function FormTextareaField<T extends FieldValues>({
  control,
  name,
  ...props
}: FormTextareaFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextareaField
          {...props}
          {...field}
          value={field.value ?? ""}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

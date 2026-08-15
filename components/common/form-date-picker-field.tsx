"use client";

import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import type { ComponentProps } from "react";
import { DatePickerField } from "@/components/common/date-picker-field";

type FormDatePickerFieldProps<T extends FieldValues> = Omit<
  ComponentProps<typeof DatePickerField>,
  "name" | "value" | "onChange"
> & {
  control: Control<T>;
  name: FieldPath<T>;
};

export function FormDatePickerField<T extends FieldValues>({
  control,
  name,
  ...props
}: FormDatePickerFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <DatePickerField
          {...props}
          name={field.name}
          value={field.value ?? ""}
          onChange={field.onChange}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
